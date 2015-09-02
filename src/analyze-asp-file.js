import fs from 'fs'
import path from 'path'
import split from 'split'
import eos from 'end-of-stream'

const funcRegex = /^function +([A-Z_0-9]+)/i
const subRegex = /^sub +([A-Z_0-9]+)/i
const includeRegex = /^<!-- +#include +file *= *"([^"]+)"/i
const aspClientRegex = /ASPClient *\. *([A-Z_0-9]+)/i

export default function(file) {
	var dirname = path.dirname(file)
	var data = {
		file,
		classes: [],
		aspClientCalls: [],
		includes: [],
		subs: [],
		funcs: [],
	}

	var currentLine = ''
	var inputStream = fs.createReadStream(file)
		.pipe(split())
		.on('data', l => {
			if(l.endsWith('_')) {
				currentLine += l.substring(0, l.length - 1)
				return
			}
			currentLine = (currentLine + l).trim()
			var line = currentLine
			currentLine = ''

			var match
			if(match = line.match(funcRegex)) {
				data.funcs.push(match[1])
				return
			}
			if(match = line.match(subRegex)) {
				data.subs.push(match[1])
				return
			}
			if(match = line.match(includeRegex)) {
				data.includes.push(path.join(dirname, match[1]))
				return
			}
			if(match = line.match(aspClientRegex)) {
				data.aspClientCalls.push(match[1])
				return
			}
		})

	return new Promise((resolve, reject) => {
		eos(inputStream, err => err ? reject(err) : resolve(data))
	})
}
