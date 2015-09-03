import path from 'path'
import { expect } from 'chai'
import { analyze } from '../src/commands'

const expectedData = require('./expected.json')

describe('analyze.js', function() {
	before(function() {
		return analyze(path.join(__dirname, 'analyze')).then(actualData => {
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
				expect(this.actualFile).to.be.ok
			})

			it('should find all includes', function() {
				expect(this.actualFile.includes).to.deep.equal(file.includes)
			})

			it('should find all aspClientCalls', function() {
				expect(this.actualFile.aspClientCalls).to.deep.equal(file.aspClientCalls)
			})
		})
	})
})
