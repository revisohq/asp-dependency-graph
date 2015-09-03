import glob from 'glob'
import throat from 'throat'
import analyzer from '../analyze-asp-file'

export default function(baseDir) {
	return new Promise((resolve, reject) => {
		glob('**/*.asp', { cwd: baseDir }, (err, files) => err ? reject(err) : resolve(files))
	})
	.then(files => files.map(throat(1, file => analyzer(baseDir, file))))
	.then(a => Promise.all(a))
}
