import * as neo from '../neo'

neo.init('http://localhost:7474')

export default function(files, log) {
	var complete = 0
	return files.reduce((p, file) =>
		p
			.then(() => neo.createFile(file))
			.then(()=>log(`${++complete}/${files.length} complete`)),
		neo.deleteAll()
	)
}
