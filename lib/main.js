'use babel'

export default {
  Hack: null,
  activate: function() {
    require('atom-package-deps').install('autocomplete-hack')
  },
  consumeHack: function(Hack) {
    this.Hack = Hack
  },
  provideAutoComplete: function() {
    const Path = require('path')
    const Regex = {
      isClass: / class$/,
      label: /(\w+)/
    }
    const Provider = {
      inclusionPriority: 100,
      excludeLowerPriority: true,
      selector: '.source.cpp, .source.hack, .source.php',
      disableForSelector: '.comment',
      parseSuggestion: suggestion => {
        const spaceIndex = suggestion.indexOf(' ')
        suggestion = [suggestion.slice(0, spaceIndex), suggestion.slice(spaceIndex + 1)]

        let type = 'property'
        let label = ''
        let snippet = null
        let text = null

        if (suggestion[1] === 'class') {
          type = 'class'
          label = 'class'
        } else {
          type = suggestion[0].substr(0, 1) === '$' ? 'variable' : 'property'
          label = Regex.label.exec(suggestion[1])[0] || ''
        }

        if (label === 'function') {
          type = 'function'
        }
        if (type === 'function') {
          const regex = /(\$\w+)/g
          let match
          let number = 0

          snippet = []
          while ((match = regex.exec(suggestion[1])) !== null) {
            ++ number
            snippet.push(`\${${number}:${match[0]}}`)
          }
          snippet = suggestion[0] + '(' + snippet.join(', ') + ')${' + (++number) + '}'
        } else {
          text = suggestion[0]
        }

        return {
          type,
          leftLabel: label,
          description: suggestion[1],
          text, snippet
          //replacementPrefix: prefix,
        }
      },
      getSuggestions: ({editor, bufferPosition}) => {
        if (this.Hack === null || !this.Hack.connected) {
          return []
        }

        const textBuffer = editor.getBuffer()
        const text = editor.getText()
        const index = textBuffer.characterIndexForPosition(bufferPosition)

        return this.Hack.exec(atom.config.get('Atom-Hack.hackExecutablePath'), ['--auto-complete'], {
          stdin: text.substr(0, index) + 'AUTO332' + text.substr(index),
          cwd: Path.dirname(editor.getPath())
        }).then(function(contents) {
          const toReturn = []
          contents.substr(0, contents.length - 1).split("\n").forEach(entry => {
            if (entry.length) {
              toReturn.push(Provider.parseSuggestion(entry))
            }
          })
          console.log(toReturn)
          return toReturn
        }).catch(err => {
          atom.notifications.addError(err.message, {dismissible: true})
          return []
        })
      }
    }
    return Provider
  }
}
