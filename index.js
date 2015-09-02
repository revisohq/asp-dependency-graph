import glob from 'glob'
import throat from 'throat'
import analyzer from './src/analyze-asp-file'

var baseDir = process.argv[2]

var p = new Promise((resolve, reject) => {
	glob('**/*.asp', { cwd: baseDir }, (err, files) => err ? reject(err) : resolve(files))
})

p.then(files => files.map(throat(1, file => analyzer(baseDir, file))))
	.then(a => Promise.all(a))
	.then(console.log, e => {console.error(e.stack);process.exit(1)})
