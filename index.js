import yargs from 'yargs'
import fs from 'fs'
import { stdout as log } from 'single-line-log'

import { analyze, upload } from './src/commands'

var baseDir = process.argv[2]

yargs
	.usage('$0 <command>')
	.command('analyze', 'Read through ASP files for data', analyzeCommand)
	.command('upload', 'Loads JSON file into neo4j', uploadCommand)
	.help('help')
	.required(1, '')
	.argv

function analyzeCommand(yargs) {
	var args = yargs
		.usage('$0 analyze <root-folder-for-asp>')
		.required(2, 'The root folder is required. The code will recurse through the folder to find *.asp files')
		.option('blacklist', {
			alias: 'b',
			description: 'A JSON file describing objects to ignore. See blacklist.example.json for details.',
		})
		.help('help')
		.argv

	var baseDir = args._[1]
	var result = analyze(baseDir)
		.then(data => JSON.stringify(data, null, '  '))
	hookUpOutput(result)
}

function uploadCommand(yargs) {
	var args = yargs
		.usage('$0 upload <json-file>')
		.required(2, 'The json-file is required')
		.help('help')
		.argv

	var jsonPath = args._[1]

	var result = new Promise((resolve, reject) => {
		fs.readFile(jsonPath, 'utf8', (err, data) => err ? reject(err) : resolve(data))
	})
		.then(JSON.parse)
		.then(data => upload(data, message => message ? log(message + '\n') : console.log('')))

	hookUpOutput(result)
}

function hookUpOutput(promise) {
	promise.then(result => {
		if(result != null) console.log(result)
	}, e => {
		console.error(e.stack)
		process.exit(1)
	})
}
