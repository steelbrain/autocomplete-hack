/* @flow */

import stringScore from 'sb-string_score'
import type { TextEditor, Point } from 'atom'

const REGEX_PREFIX = /((:\w[\w:-]+)|(\$\w*)|::(\w+)|(\w+))$/

export function getTransformedText(textEditor: TextEditor, bufferPosition: Point): string {
  const textBuffer = textEditor.getBuffer()
  const text = textBuffer.getText()
  const index = textBuffer.characterIndexForPosition(bufferPosition)
  return text.substr(0, index) + 'AUTO332' + text.substr(index)
}

export function parseSuggestions(suggestions: string, prefix: string): Array<Object> {
  const toReturn = []
  const chunks = suggestions.split('\n')
  for (let i = 0, length = chunks.length; i < length; ++i) {
    const chunk = chunks[i].trim()
    const firstSpace = chunk.indexOf(' ')

    let type = 'property'
    const replacement = chunk.substr(0, firstSpace)
    const description = chunk.substr(firstSpace + 1) || '_'
    const label = description.split(' ')[0]

    if (description === 'class') {
      type = 'class'
    } else if (replacement.substr(0, 1) === '$') {
      type = 'variable'
    } else if (label === 'function') {
      type = 'function'
    }
    const score = stringScore(chunk, prefix)
    if (prefix !== '' && score === 0) {
      continue
    }

    toReturn.push({
      type,
      leftLabel: label,
      description,
      text: replacement,
      // snippet,
      replacementPrefix: prefix,
      score: stringScore(chunk, prefix),
    })
  }
  return toReturn
}

export function getPrefix(editor: TextEditor, bufferPosition: Point): string {
  const lineText = editor.getTextInBufferRange([bufferPosition, [bufferPosition.row, 0]])
  const matches = REGEX_PREFIX.exec(lineText) || []
  return matches[2] || matches[3] || matches[4] || matches[5] || ''
}
