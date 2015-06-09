require 'string_score'
Hack = require('./hack')

module.exports =
  activate:->
    if typeof atom.packages.getLoadedPackage("autocomplete-plus") is 'undefined'
      return atom.notifications.addError "[Hack] autocomplete-plus Package not found, but is required for autocomplete.", dismissable: true
    else if typeof atom.packages.getLoadedPackages("atom-hack") is 'undefined'
      return atom.notifications.addError "[Hack] atom-hack Package not found, but is required for autocomplete", dismissable: true
  provide:->
    Path = require('path')
    Hack.init()
    ArgumentsRegex = /function.*?\((.*?)\)/
    Provider =
      inclusionPriority: 100
      excludeLowerPriority: true # To suppress the html autocompleter
      selector: '.source.cpp, .source.hack, .source.php'
      disableForSelector: '.comment'
      Map:{
        int: 'Integer'
        float: 'Float'
        string: 'String'
        bool: 'Boolean'
        array: 'Array'
        num: 'Number'
        mixed: 'Mixed'
      }
      getType:(Text, Label)->
        leftLabel = Label
        Type = Label
        if Label is 'class' or Text is '$this'
          Type = 'class'
          leftLabel = 'Class'
        else if typeof Provider.Map[Label] isnt 'undefined'
          Type = if Text.substr(0,1) is '$' then 'variable' else 'property'
          leftLabel = Provider.Map[Label]
        else
          Type = if Text.substr(0,1) is '$' then 'variable' else 'property'
          leftLabel = /(\w+)/.exec(Label)[0] || ''
        if leftLabel is 'function'
          Type = 'function'
        return {Type, leftLabel}
      getPrefix:(editor, bufferPosition)->
        regex = /::([\$\w0-9_-]+)$|\)\s*:(\w+)$|(:[\$\w0-9_-]+)$|([\$\w0-9_-]+)$/
        line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
        match = line.match regex
        return '' unless match
        return match[4] || match[3] || match[2] || match[1] || match[0]
      getSuggestions: ({editor, bufferPosition, scopeDescriptor}) ->
        return [] unless Hack.config.status
        prefix = Provider.getPrefix editor, bufferPosition
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
              {leftLabel, Type} = Provider.getType(Text, Label)
              EntryToReturn = {
                type: Type
                leftLabel: leftLabel
                description: Label
                replacementPrefix: prefix
                score: prefix.length > 0 and Text.score(prefix)
              }
              if Type is 'function'
                RegexResult = ArgumentsRegex.exec Label
                if RegexResult and RegexResult[1] and RegexResult[1].length
                  Snippet = []
                  ExtractionRegexp = /(\$\w+)/g
                  Num = 0
                  while (Result = ExtractionRegexp.exec(RegexResult[1])) isnt null
                    ++Num
                    Result = Result[1]
                    Snippet.push "${#{Num}:#{Result}}"
                  Snippet = Text + "(" + Snippet.join(", ") + ")"
                  EntryToReturn.snippet = Snippet
                else
                  EntryToReturn.text = Text + "()"
              else
                EntryToReturn.text = Text
              return EntryToReturn
            )
            ToReturn.sort (a,b)=>
              b.score - a.score
            Resolve(ToReturn)
    return Provider