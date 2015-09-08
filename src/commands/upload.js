import * as neo from '../neo'

neo.init('http://localhost:7474')

export default function(files, log) {
	var complete = 0
	var promise = neo.deleteAll()

	promise.then(()=>{complete = 0})
	promise = files.reduce(addFile, promise)
	promise = promise.then(neo.createIncludes).then(()=>console.log('Includes created'))
	promise = promise.then(()=>{
		log()
		var c = 0
		var interval = setInterval(()=>{
			log('Creating calls' + '.'.repeat(c++))
			if(c == 4) c = 0
		}, 500)
		return neo.createCalls()
			.then(()=>clearInterval(interval))
	}).then(()=>log('Calls created'))

	return promise

	function addFile(promise, file) {
		return promise
			.then(() => neo.createFile(file))
			.then(()=>log(`Load files: ${++complete}/${files.length} files`))
	}
}
