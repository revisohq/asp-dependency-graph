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
		CREATE (file)-[:DEFINES]->(fn${idx}:Function { name: '${func.name}' })
		${func.aspClientCalls.map(aspFn => `
			CREATE (fn${idx})-[:CALLS]->(ac${aspFn})
		`.trim()).join('\n')}
	`.trim())
	let subCreates = file.subs.map((sub, idx) => `
		CREATE (file)-[:DEFINES]->(sub${idx}:Sub { name: '${sub.name}' })
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
		CREATE (file:File { path: {path} })
		${funcCreates.join('\n')}
		${subCreates.join('\n')}
		${aspClientFuncs.join('\n')}
	`, { path: file.file })
}
