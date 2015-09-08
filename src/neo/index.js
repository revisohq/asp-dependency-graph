import { GraphDatabase } from 'neo4j'
import flatmap from 'flatmap'

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

export function addASPCalls(file) {
	var callables = file.funcs.concat(file.subs)

	var matchCallables = callables
		.map(f=>f.name)
		.concat(file.calls, flatmap(callables, callable => callable.calls))
		.filter((v,i,a)=>a.indexOf(v)==i)
		.map(name => `MATCH (c${name}:ASPCallable { name: '${name}' })`)

	var fileCalls = file.calls.map(f => `CREATE (file)-[:CALLS]->(c${f})`)
	var callableCalls = flatmap(callables, callable =>
		callable.calls.map(f => `CREATE (c${callable.name})-[:CALLS]->(c${f})`)
	)

	if(fileCalls.length == 0 && callableCalls.length == 0) {
		return Promise.resolve()
	}

	return query(`
		MATCH (file:File { path: {path}})
		${matchCallables.join('\n')}
		${fileCalls.join('\n')}
		${callableCalls.join('\n')}
	`, {path: file.path})
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
		CREATE (file)-[:DEFINES]->(fn${idx}:ASPCallable:Function { name: '${func.name}' })
		${func.aspClientCalls.map(aspFn => `
			CREATE (fn${idx})-[:CALLS]->(ac${aspFn})
		`.trim()).join('\n')}
	`.trim())
	let subCreates = file.subs.map((sub, idx) => `
		CREATE (file)-[:DEFINES]->(sub${idx}:ASPCallable:Sub { name: '${sub.name}' })
		${sub.aspClientCalls.map(aspFn => `
			CREATE (sub${idx})-[:CALLS]->(ac${aspFn})
		`.trim()).join('\n')}
	`.trim())
	let aspClientFuncs = file.aspClientCalls.map(fn => `
		CREATE (file)-[:CALLS]->(ac${fn})
	`.trim())
	let includeMatches = file.includes.filter((v,i,a)=>a.indexOf(v)==i).map(path => `
		MERGE (\`file${path}\`:File { path: '${path}' })
	`)
	let includeCreates = file.includes.map(path => `
		CREATE (file)-[:INCLUDES]->(\`file${path}\`)
	`.trim())
	return query(`
		MERGE (aspClient:ASPClient)
		${aspClientCallsCreates.join('\n')}
		MERGE (file:File { path: '${file.path}' })
		${includeMatches.join('\n')}
		${includeCreates.join('\n')}
		${funcCreates.join('\n')}
		${subCreates.join('\n')}
		${aspClientFuncs.join('\n')}
	`)
}
