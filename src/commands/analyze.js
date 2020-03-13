import glob from 'glob'
import throat from 'throat'
import analyzer from '../analyze-asp-file.js'

export default function(baseDir, options = {}) {
	var blacklist = options.blacklist || {}
	var blacklistedFiles = (blacklist.files || []).map(f => f.toLocaleLowerCase())
	var blacklistedFunctions = (blacklist.functions || []).map(f => f.toLocaleLowerCase())

	return new Promise((resolve, reject) => {
		glob('**/*.asp', { cwd: baseDir }, (err, files) => err ? reject(err) : resolve(files))
	})
	.then(files => files
		.filter(file => blacklistedFiles.indexOf(file.toLocaleLowerCase()) == -1)
		.map(throat(1, file => analyzer(baseDir, file)))
	)
	.then(a => Promise.all(a))
	.then(files => {
		let allFunctions = files.flatMap(file => file.funcs.concat(file.subs))
			.filter(fn => blacklistedFunctions.indexOf(fn.name) == -1)
		return files.map(throat(1, file => analyzer(baseDir, file.path, allFunctions)))
	})
	.then(a => Promise.all(a))
	.then(files => files.map(file => {
		delete file.dims
		file.includes = file.includes.filter(inc => blacklistedFiles.indexOf(inc) == -1)
		file.funcs = file.funcs.filter(s => blacklistedFunctions.indexOf(s.name) == -1)
		file.funcs.forEach(f => { delete f.dims })
		file.subs = file.subs.filter(s => blacklistedFunctions.indexOf(s.name) == -1)
		file.subs.forEach(f => { delete f.dims })
		return file
	}))
}
