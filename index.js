import glob from 'glob'
import throat from 'throat'
import { stdout as log } from 'single-line-log'
import analyzer from './src/analyze-asp-file'
import * as neo from './src/neo'

var baseDir = process.argv[2]

neo.init('http://localhost:7474')

var p = Promise.all([
	new Promise((resolve, reject) => {
		glob('**/*.asp', { cwd: baseDir }, (err, files) => err ? reject(err) : resolve(files))
	}),
	neo.deleteAll(),
]).then(r => r[0])

p.then(files => files.map(throat(1, file => analyzer(baseDir, file))))
	.then(a => Promise.all(a))
	.then(files => {
		var complete = 0
		return files.reduce((p, file) => p
			.then(() => neo.createFile(file))
			.then(()=>log(`${++complete}/${files.length} complete`)),
		Promise.resolve())
	})
	.catch(e => {console.error(e.stack);process.exit(1)})
