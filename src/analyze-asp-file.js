import fs from 'fs'
import split from 'split'
import eos from 'end-of-stream'

export default function(file) {
	var data = {
		file,
		includes: [],
		subs: [],
		funcs: [],
		lines: 0,
	}
	var inputStream = fs.createReadStream(file)
		.pipe(split())
		.on('data', line => {
			data.lines++
		})
	return new Promise((resolve, reject) => {
		eos(inputStream, err => err ? reject(err) : resolve(data))
	})
}
