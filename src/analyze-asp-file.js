import fs from 'fs'
import split from 'split'
import eos from 'end-of-stream'

export default function(file) {
	var data = {
		file,
		includes: [],
		subs: [],
		funcs: [],
	}

	var currentLine = ''
	var inputStream = fs.createReadStream(file)
		.pipe(split())
		.on('data', line => {
			if(line.endsWith('_')) {
				currentLine += line.substring(0, line.length - 1)
				return
			}
			currentLine += line
			console.log('line:', currentLine)

			currentLine = ''
		})

	return new Promise((resolve, reject) => {
		eos(inputStream, err => err ? reject(err) : resolve(data))
	})
}
