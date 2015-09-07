import fs from 'fs'
import flatmap from 'flatmap'
import path from 'path'
import split from 'split'
import eos from 'end-of-stream'

const funcRegex = /^function +([a-z_0-9]+) *\(([^)]*)/
const subRegex = /^sub +([a-z_0-9]+) *\(([^)]*)\)/
const includeRegex = /<!-- +#include +file *= *"([^"]+)"/
const aspClientRegex = /aspclient *\. *([a-z_0-9]+)/
const commentRegex = /(\/\/|').*$/
const stringRegex = /"([^"]||"")*"/
const dim = /^dim +([a-z_0-9]+)/
const funcDelims = '[, -+*/:()=]'

export default function(baseDir, file, allFunctions = []) {
	allFunctions.forEach(f => {
		f.regex = new RegExp(`(^|${funcDelims})${f.name}(${funcDelims}|$)`)
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

	var lines = []
	var currentLine = ''
	var inputStream = fs.createReadStream(path.join(baseDir, file))
		.pipe(split())
		.on('data', l => {
			let line = l.toLocaleLowerCase()
			let nextStart = line.indexOf('<%')
			let nextStop = line.indexOf('%>')
			while(/<%|%>/.test(line)) {
				nextStart = line.indexOf('<%')
				nextStop = line.indexOf('%>')

				// 'asp-code %> non-asp'
				if(nextStart == -1) {
					lines.push(line.substring(0, nextStop))
					line = '%>'
					break
				// 'non-asp <% asp-code'
				} else if(nextStop == -1) {
					lines.push('<%')
					line = line.substring(nextStart + 2)
					break
				// 'asp-code %> non-asp <% asp-code ...'
				} else if(nextStop < nextStart) {
					let l = line.substring(0, nextStop)
					lines.push(l, '%>')
					line = line.substring(l.length + 2)
					continue
				// 'non-asp <% asp-code %> non-asp ...'
				} else {
					let l = line.substring(nextStart + 2, nextStop)
					lines.push('<%', l, '%>')
					line = line.substring(l.length + 4 + nextStart)
					continue
				}
			}
			lines.push(line)
		})

	return new Promise((resolve, reject) => {
		eos(inputStream, err => err ? reject(err) : resolve())
	})
		.then(()=>{
			flatmap(lines.filter(line => {
				var match
				if(match = line.match(includeRegex)) {
					data.includes.push(path.join(dirname, match[1]))
				}
				if(line == '<%') {
					isInASP = true
					return false
				}
				if(line == '%>') {
					isInASP = false
					return false
				}
				return isInASP
			}), line => line.replace(stringRegex, '""').split(':').map(l => l.trim())).forEach(line => {
				if(line == '') return

				line = line.replace(commentRegex, '')

				handleASPLine(line)
			})
			return data
		})

	function handleASPLine(l) {
		currentLine = (currentLine + l.trim())
		var line = currentLine
		if(line.endsWith('_')) {
			currentLine += l.substring(0, l.length - 1)
			return
		}
		currentLine = ''

		var match
		if(match = line.match(funcRegex)) {
			assertNestedFunction(match)
			currentFunction = funcFromMatch(match)
			data.funcs.push(currentFunction)
			return
		}
		if(line == 'end function') {
			currentFunction = null
			return
		}

		if(match = line.match(subRegex)) {
			assertNestedFunction(match)
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
				if(store.name) {
					// We are returning a value
					if(store.name == wrap.name) return

					// We are referencing a local var instead of a function
					let allDims = allFunctions.find(f => f.name == store.name).dims
					if(allDims.indexOf(wrap.name) != -1) return
				}
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

	function assertNestedFunction(match) {
		if(currentFunction != null || currentSub != null) {
			var current = currentFunction != null ? currentFunction.name : currentSub.name
			throw new Error(`Found nested function definition in ${file}: ${match[1]}() was nested inside ${current}()`)
		}
	}
}
