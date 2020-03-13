import neo4j from 'neo4j'
import flatmap from 'flatmap'
const { GraphDatabase } = neo4j

let initDeferred
let initPromise = new Promise((resolve, reject) => {
	initDeferred = { resolve, reject }
})

function query(query, ...params) {
	return initPromise.then(graph => new Promise((resolve, reject) => {
		graph.query(query, ...params, (err, res) => {
			err ? reject(err) : resolve(res)
		})
	}))
}

export function init(url) {
	initDeferred.resolve(new GraphDatabase(url))
	return query
}

export function deleteAll() {
	return query(`
		MATCH (n)
		OPTIONAL MATCH (n)-[r]-()
		DELETE n,r
	`)
}

export function createIncludes() {
	return query(`
		MATCH (file:File)
		WITH file, split(file.includes, ',') AS includes
		UNWIND includes AS includePath

		MATCH (includedFile:File) WHERE includedFile.path = includePath
		CREATE (file)-[:INCLUDES]->(includedFile)
	`).then(()=>query(`
		MATCH (file:File)
		REMOVE file.includes
	`))
}

export function createCalls() {
	return query(`
		MATCH (caller) WHERE caller.calls <> ''

		OPTIONAL MATCH (file:File)-[:DEFINES]->(caller)
		// We assume that callers without defines are files!
		WITH caller, coalesce(file, caller) AS file

		OPTIONAL MATCH (parent:File)-[:INCLUDES*]->(file)
		WITH caller, [parent, file] AS files UNWIND files AS file
		OPTIONAL MATCH (file)-[:INCLUDES*]->(child:File)
		WITH caller, [file, child] AS files
		UNWIND files AS file
		WITH caller, collect(distinct file) AS files

		WITH caller, files, split(caller.calls, ',') AS calls
		UNWIND calls AS call
		MATCH (callee:ASPCallable {name:call})<-[:DEFINES]-(file) WHERE file IN files
		WITH caller, callee
		CREATE (caller)-[:CALLS]->(callee)
	`).then(()=>query(`
		MATCH (caller)
		REMOVE caller.calls
	`))
}

export function createFile(file) {
	let aspClientCallsCreates = file.aspClientCalls.concat(
		flatmap(file.funcs, func=>func.aspClientCalls),
		flatmap(file.subs, sub=>sub.aspClientCalls),
	)
		.filter((v,i,a)=>a.indexOf(v)==i)
		.map(fn => `
			MERGE (aspClient)-[:DEFINES]->(ac${fn}:ASPClientFunction {name: '${fn}'})
		`.trim())

	let funcCreates = file.funcs.map((func, idx) => `
		CREATE (file)-[:DEFINES]->(fn${idx}:ASPCallable:Function {
			name: '${func.name}',
			calls: '${func.calls.join(',')}'
		})
		${func.aspClientCalls.map(aspFn => `
			CREATE (fn${idx})-[:CALLS]->(ac${aspFn})
		`.trim()).join('\n')}
	`.trim())
	let subCreates = file.subs.map((sub, idx) => `
		CREATE (file)-[:DEFINES]->(sub${idx}:ASPCallable:Sub {
			name: '${sub.name}',
			calls: '${sub.calls.join(',')}'
		})
		${sub.aspClientCalls.map(aspFn => `
			CREATE (sub${idx})-[:CALLS]->(ac${aspFn})
		`.trim()).join('\n')}
	`.trim())
	let aspClientFuncs = file.aspClientCalls.map(fn => `
		CREATE (file)-[:CALLS]->(ac${fn})
	`.trim())
	return query(`
		MERGE (aspClient:ASPClient)
		${aspClientCallsCreates.join('\n')}
		MERGE (file:File {
			path: '${file.path}',
			includes: '${file.includes.join(',')}',
			calls: '${file.calls.join(',')}'
		})
		${funcCreates.join('\n')}
		${subCreates.join('\n')}
		${aspClientFuncs.join('\n')}
	`)
}
