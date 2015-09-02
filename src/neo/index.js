import { GraphDatabase } from 'neo4j'

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
	let funcCreates = file.funcs.map((func, idx) => `
		CREATE (file)-[:DEFINES]->(fn${idx}:Function { name: '${func}' })
	`.trim())
	let subCreates = file.subs.map((sub, idx) => `
		CREATE (file)-[:DEFINES]->(sub${idx}:Sub { name: '${sub}' })
	`.trim())
	let aspClientFuncs = file.aspClientCalls.map((fn, idx) => `
		MERGE (aspClient)-[:DEFINES]->(ac${idx}:ASPClientFunction { name: '${fn}' })
		CREATE (file)-[:CALLS]->(ac${idx})
	`.trim())
	return query(`
		MERGE (aspClient:ASPClient)
		CREATE (file:File { path: {path} })
		${funcCreates.join('\n')}
		${subCreates.join('\n')}
		${aspClientFuncs.join('\n')}
	`, { path: file.file })
}
