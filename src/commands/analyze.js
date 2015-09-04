import glob from 'glob'
import throat from 'throat'
import flatmap from 'flatmap'
import analyzer from '../analyze-asp-file'

export default function(baseDir) {
	return new Promise((resolve, reject) => {
		glob('**/*.asp', { cwd: baseDir }, (err, files) => err ? reject(err) : resolve(files))
	})
	.then(files => files.map(throat(1, file => analyzer(baseDir, file))))
	.then(a => Promise.all(a))
	.then(files => {
		let allFunctions = flatmap(files, file => file.funcs.concat(file.subs))
		return files.map(throat(1, file => analyzer(baseDir, file.path, allFunctions)))
	})
	.then(a => Promise.all(a))
	.then(files => files.map(file => {
		delete file.dims
		file.funcs.forEach(f => { delete f.dims })
		file.subs.forEach(f => { delete f.dims })
		return file
	}))
}
