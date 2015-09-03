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
		path: file,
		classes: [],
		aspClientCalls: [],
		includes: [],
		subs: [],
		funcs: [],
	}

	var isInASP = false
	var currentFunction = null
	var currentSub = null

	var currentLine = ''
	var inputStream = fs.createReadStream(path.join(baseDir, file))
		.pipe(split())
		.on('data', l => {
			if(l.trim() == '') return

			if(l.endsWith('_')) {
				currentLine += l.substring(0, l.length - 1)
				return
			}
			currentLine = (currentLine + l).trim()
			var line = currentLine
			currentLine = ''

			var lines = []
			if(/<%|%>/.test(line)) {
				let nextStart
				let nextStop
				do {
					nextStart = line.indexOf('<%')
					nextStop = line.indexOf('%>')

					// 'asp-code %> non-asp'
					if(nextStart == -1) {
						line = line.substring(0, nextStop)
						lines.push(line)
						break
					// 'non-asp <% asp-code'
					} else if(nextStop == -1) {
						line = line.substring(nextStart)
						lines.push(line)
						break
					// 'asp-code %> non-asp <% asp-code ...'
					} else if(nextStop < nextStart) {
						let l = line.substring(0, nextStop + 2)
						lines.push(l)
						line = line.substring(l.length)
						continue
					// 'non-asp <% asp-code %> non-asp ...'
					} else {
						let l = line.substring(nextStart, nextStop)
						lines.push(l)
						line = line.substring(l.length + nextStart)
						continue
					}
				} while(nextStart != -1 || nextStop != -1)
			} else {
				lines.push(line)
			}

			lines.forEach(line => {
				if(!isInASP) {
					var match
					if(match = line.match(includeRegex)) {
						data.includes.push(path.join(dirname, match[1]))
						return
					}

					if(!line.includes('<%')) {
						// We are not in ASP. Ignore everything!
						return
					}

					line = line.substring(line.indexOf('<%')).trim()
					isInASP = true
				}

				if(line.includes('%>')) {
					line = line.substring(0, line.indexOf('%>')).trim()
					isInASP = false

					if(line.length == 0) return
				}

				handleASPLine(line)
			})
		})

	return new Promise((resolve, reject) => {
		eos(inputStream, err => err ? reject(err) : resolve(data))
	})

	function handleASPLine(line) {
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
	}
}
