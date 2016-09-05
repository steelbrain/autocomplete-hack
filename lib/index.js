/* @flow */

import Path from 'path'
import { shouldTriggerAutocomplete } from 'atom-autocomplete'
import type { TextEditor, Point } from 'atom'

import { getTransformedText } from './helpers'

let delegates

export default {
  activate() {
    require('atom-package-deps').install() // eslint-disable-line global-require
  },
  consumeDelegateRegistry(registry: Object) {
    delegates = registry
  },
  provideAutoComplete() {
    return {
      inclusionPriority: 100,
      excludeLowerPriority: true,
      selector: '.source.hack, .source.php',
      disableForSelector: '.comment',
      async getSuggestions({ editor, bufferPosition, activatedManually }: { editor: TextEditor, bufferPosition: Point, activatedManually: boolean }): Promise<Array<Object>> {
        if (!shouldTriggerAutocomplete({ editor, bufferPosition, activatedManually })) {
          return []
        }
        const editorPath = editor.getPath()
        const delegate = delegates && delegates.getDelegateForPath(editorPath)
        if (!delegate) {
          return []
        }
        const editorText = getTransformedText(editor, bufferPosition)
        const results = await delegate.exec('--auto-complete', { stdin: editorText, cwd: Path.dirname(editorPath) })
        console.log('autocomplete-results', results)
        return []
      },
    }
  },
}
