require 'string_score'

module.exports =
  activate:->
  provide:->
    Path = require('path')
    Hack = require('./hack')
    if typeof atom.packages.getLoadedPackage("autocomplete-plus") is 'undefined'
      return Hack.showError("autocomplete-plus Package not found, but is required for to provide autocomplete.")
    Hack.init();
    Provider =
      selector: '.source.cpp, .source.hack, .source.cpp'
      disableForSelector: '.comment'

      getSuggestions: ({editor, bufferPosition, scopeDescriptor, prefix}) ->
        return [] unless Hack.config.status
        Buffer = editor.getBuffer()
        Text = Buffer.getText()
        Index = Buffer.characterIndexForPosition(bufferPosition)
        Text = Text.substr(0, Index) + 'AUTO332' + Text.substr(Index)
        Command = "hh_client --auto-complete <<'EOFAUTOCOMPLETE'\n" + Text + "\nEOFAUTOCOMPLETE"
        new Promise (Resolve) ->
          Hack.exec(Command, Path.dirname(editor.getPath())).then (Result)->
            Result = Result.stdout.split("\n").filter((e) -> e)
            ToReturn = Result.map((Entry)->
              Entry = Entry.split(' ')
              Text = Entry[0]
              Label = Entry.slice(1).join(' ')
              if Text.substr(0,1) is '$'
                Type = 'variable'
              else if Text is 'class' and Label is 'string'
                Type = 'class'
              else
                Type = 'property'
              return {
                type: Type
                text: Text
                leftLabel: Label
                score: prefix.length > 0 and Text.score(prefix)
              }
            )
            ToReturn.sort (a,b)=>
              b.score - a.score
            Resolve(ToReturn)
    return Provider