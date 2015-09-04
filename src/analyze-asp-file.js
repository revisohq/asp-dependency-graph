import fs from 'fs'
import path from 'path'
import split from 'split'
import eos from 'end-of-stream'

const funcRegex = /^function +([A-Z_0-9]+) *\(([^)]*)/i
const subRegex = /^sub +([A-Z_0-9]+) *\(([^)]*)\)/i
const includeRegex = /^<!-- +#include +file *= *"([^"]+)"/i
const aspClientRegex = /ASPClient *\. *([A-Z_0-9]+)/i
const dim = /^dim +([A-Z_0-9]+)/i
const funcDelims = '[, -+*/:()=]'

export default function(baseDir, file, allFunctions = []) {
	allFunctions.forEach(f => {
		f.regex = new RegExp(`(^|${funcDelims})${f.name}(${funcDelims}|$)`, 'i')
	})
	var dirname = path.dirname(file)
	var data = {
		path: file,
		classes: [],
		aspClientCalls: [],
		includes: [],
		subs: [],
		funcs: [],
		calls: [],
		dims: [],
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
			let nextStart = line.indexOf('<%')
			let nextStop = line.indexOf('%>')
			while(/<%|%>/.test(line)) {
				nextStart = line.indexOf('<%')
				nextStop = line.indexOf('%>')

				// 'asp-code %> non-asp'
				if(nextStart == -1) {
					line = line.substring(0, nextStop + 2)
					break
				// 'non-asp <% asp-code'
				} else if(nextStop == -1) {
					line = line.substring(nextStart)
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
			}
			lines.push(line)

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
			currentFunction = funcFromMatch(match)
			data.funcs.push(currentFunction)
			return
		}
		if(line == 'end function') {
			currentFunction = null
			return
		}

		if(match = line.match(subRegex)) {
			currentSub = funcFromMatch(match)
			data.subs.push(currentSub)
			return
		}
		if(line == 'end sub') {
			currentSub = null
			return
		}
		if(match = line.match(dim)) {
			let store = getCurrentStore()
			store.dims.push(match[1])
			return
		}

		if(match = line.match(aspClientRegex)) {
			let store = getCurrentStore()
			store.aspClientCalls.push(match[1])
			return
		}

		allFunctions.forEach(wrap => {
			if(wrap.regex.test(line)) {
				let store = getCurrentStore()
				let allDims = store.name ? allFunctions.find(f => f.name == store.name).dims : []
				if(allDims.indexOf(wrap.name) != -1) return
				store.calls.push(wrap.name)
			}
		})
	}

	function getCurrentStore() {
		if(currentFunction != null) {
			return currentFunction
		} else if(currentSub != null) {
			return currentSub
		} else {
			return data
		}
	}

	function funcFromMatch(match) {
		return {
			name: match[1],
			calls: [],
			aspClientCalls: [],
			dims: match[2].split(',').map(s => s.trim()).filter(s => s.length > 0),
		}
	}
}
