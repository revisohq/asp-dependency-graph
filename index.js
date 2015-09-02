import analyzer from './src/analyze-asp-file'

var file = process.argv[2]
analyzer(file).then(console.log, console.error)
