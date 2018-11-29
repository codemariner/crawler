const path = require('path')

const { keysIn } = require('ramda')

const { analyzePages } = require('../page-handler')


describe('analyzePages', () => {

  describe('given an invalid page url', () => {
    it('should return error results', async () => {
      const url = 'http://bad.url.x'
      const result = await analyzePages(url, (window) => {
        return {foo:'bar'}
      })
      expect(result[url].error).toBeTruthy()
    })
  })

  describe('given multiple page urls', () => {
    const urls = [
      `file://${path.join(__dirname, 'test1.html')}`,
      'http://bad.url',
    ]

    const analyzers = [
      (window) => 0,
      function doit(window) {
        return 1
      }
    ]

    it('should invoke a callback for each page that is anaylzed', async () => {
      let n = 0
      const callback = () => ( n++ )

      const results = await analyzePages(urls, analyzers, callback)
      expect(n).toBe(2)
    })

    it('should return results for each analyzer', async () => {
      const results = await analyzePages(urls, analyzers)
      expect(keysIn(results)).toEqual(urls)
      expect(keysIn(results[urls[0]])).toEqual(['0', 'doit'])
      expect(keysIn(results[urls[1]])).toEqual(['error'])
    })
  })
;})
