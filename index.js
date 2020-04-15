import yargs from 'yargs'
import fs from 'fs'
import sll from 'single-line-log'
const { stdout: log } = sll

import { analyze, upload } from './src/commands/index.js'

var baseDir = process.argv[2]

yargs
	.usage('$0 <command>')
	.command('analyze', 'Read through ASP files for data',
		(yargs) => yargs
			.usage('$0 analyze --output <output-file> <root-folder-for-asp>')
			.required(1, 'The root folder is required. The code will recurse through the folder to find *.asp files')
			.option('output', {
				description: 'Path to the output file',
				required: true,
			})
			.option('blacklist-file', {
				description: 'A JSON file describing objects to ignore. See blacklist.example.json for details.',
			}),
		analyzeCommand,
	)
	.command('upload', 'Loads JSON file into neo4j',
		(yargs) => yargs
			.usage('$0 upload <output-from-analyze>')
			.required(1, 'The json-file is required'),
		uploadCommand,
	)
	.help('help')
	.required(1, '')
	.argv

function analyzeCommand(args) {
	var baseDir = args._[1]
	var options = {}
	if(args.blacklistFile) {
		options.blacklist = JSON.parse(fs.readFileSync(args.blacklistFile, 'utf8'))
	}
	var result = analyze(baseDir, options)
		.then(data => JSON.stringify(data, null, '  '))
	hookUpOutput(result, args.output)
}

function uploadCommand(args) {
	var jsonPath = args._[1]

	var result = new Promise((resolve, reject) => {
		fs.readFile(jsonPath, 'utf8', (err, data) => err ? reject(err) : resolve(data))
	})
		.then(JSON.parse)
		.then(data => upload(data, message => message ? log(message + '\n') : console.log('')))

	hookUpOutput(result)
}

function hookUpOutput(promise, outputPath) {
	promise.then(result => {
		if(result != null) {
			return fs.promises.writeFile(outputPath, result)
		}
	})
	.catch(e => {
		console.error(e.stack)
		process.exit(1)
	})
}
