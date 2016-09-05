/* @flow */

import type { TextEditor, Point } from 'atom'

export function getTransformedText(textEditor: TextEditor, bufferPosition: Point): string {
  const textBuffer = textEditor.getBuffer()
  const text = textBuffer.getText()
  const index = textBuffer.characterIndexForPosition(bufferPosition)
  return text.substr(0, index) + 'AUTO332' + text.substr(index)
}
