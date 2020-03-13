import path from 'path'
import { createRequire } from "module"
import { fileURLToPath } from "url"
import chai from 'chai'
const { expect } = chai
import { analyze } from '../src/commands/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)
const expectedData = require('./expected.json')

describe('analyze.js', function() {
	before(function() {
		var blacklist = {
			files: ['blacklisted-file.asp'],
			functions: ['blacklistedsub', 'blacklistedfunction'],
		}
		return analyze(path.join(__dirname, 'analyze'), { blacklist }).then(actualData => {
			this.actualData = actualData
		})
	})

	it('should not find unexpected items', function() {
		var wronglyFound = this.actualData.filter(f => expectedData.find(ef => ef.path == f.path) == null)
		expect(wronglyFound).to.deep.equal([])
	})

	expectedData.forEach(file => {
		describe(`Analyzing file ${file.path}`, function() {
			beforeEach(function() {
				this.actualFile = this.actualData.find(f => f.path == file.path)
				if(this.actualFile == null) throw new Error('File was not parsed')
			})

			it('should find all includes', function() {
				expect(this.actualFile.includes).to.deep.equal(file.includes)
			})

			it('should find all aspClientCalls', function() {
				expect(this.actualFile.aspClientCalls).to.deep.equal(file.aspClientCalls)
			})

			it('should find all asp-calls', function() {
				expect(this.actualFile.calls).to.deep.equal(file.calls || [])
			})

			describe('and looking for functions', function() {
				it('should not find extra functions', function() {
					var extra = this.actualFile.funcs.filter(f => file.funcs.find(f1 => f.name == f1.name) == null)
					expect(extra).to.deep.equal([])
				})

				file.funcs.forEach(func => {
					it(`should find ${func.name}`, function() {
						expect(this.actualFile.funcs.find(f => f.name == func.name))
							.to.deep.equal(func)
					})
				})
			})

			describe('and looking for subs', function() {
				it('should not find extra subs', function() {
					var extra = this.actualFile.subs.filter(f => file.subs.find(f1 => f.name == f1.name) == null)
					expect(extra).to.deep.equal([])
				})

				file.subs.forEach(sub => {
					it(`should find ${sub.name}`, function() {
						expect(this.actualFile.subs.find(s => s.name == sub.name))
							.to.deep.equal(sub)
					})
				})
			})
		})
	})
})
