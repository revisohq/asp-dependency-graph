import fs from 'fs'
import path from 'path'
import split from 'split'
import eos from 'end-of-stream'

const funcRegex = /^function +([A-Z_0-9]+)/i
const subRegex = /^sub +([A-Z_0-9]+)/i
const includeRegex = /^<!-- +#include +file *= *"([^"]+)"/i
const aspClientRegex = /ASPClient *\. *([A-Z_0-9]+)/i

export default function(baseDir, file) {
	var dirname = path.dirname(file)
	var data = {
		file,
		classes: [],
		aspClientCalls: [],
		includes: [],
		subs: [],
		funcs: [],
	}

	var currentFunction = null
	var currentSub = null

	var currentLine = ''
	var inputStream = fs.createReadStream(path.join(baseDir, file))
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
				currentFunction = {
					name: match[1],
					calls: [],
					aspClientCalls: [],
				}
				data.funcs.push(currentFunction)
				return
			}
			if(line == 'end function') {
				currentFunction = null
				return
			}

			if(match = line.match(subRegex)) {
				currentSub = {
					name: match[1],
					calls: [],
					aspClientCalls: [],
				}
				data.subs.push(currentSub)
				return
			}
			if(line == 'end sub') {
				currentSub = null
				return
			}

			if(match = line.match(includeRegex)) {
				data.includes.push(path.join(dirname, match[1]))
				return
			}
			if(match = line.match(aspClientRegex)) {
				let store
				if(currentFunction != null) {
					store = currentFunction
				} else if(currentSub != null) {
					store = currentSub
				} else {
					store = data
				}
				store.aspClientCalls.push(match[1])
				return
			}
		})

	return new Promise((resolve, reject) => {
		eos(inputStream, err => err ? reject(err) : resolve(data))
	})
}
