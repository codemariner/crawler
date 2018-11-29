const { uniq } = require('ramda')


const {
  _finalizeResults,
  _getLinks,
  _sanitizeUrl,
  crawl
} = require('../crawler')

describe('crawler', () => {
  it('should crawl', async () => {
    jest.setTimeout(60000)
    const results = await crawl('https://webflow.com/#', { depth: 2 }, (url, result) => {
      console.log('result for', url, result)
    })
    console.log('final results', results)
  })

  it('should sanitize urls', () => {
    const urls = [
      'https://webflow.com',
      'https://webflow.com/#',
      'https://webflow.com/',
      'https://webflow.com/dashboard',
      'https://webflow.com/dashboard/',
      'https://webflow.com/?utm_campaign=brandjs',
      'https://webflow.com/discover/popular#recent',
      'https://webflow.com/foo/bar?baz=1',
    ]

    const sanitizedUrls = uniq(urls.map(_sanitizeUrl))
    expect(sanitizedUrls).toEqual([
      'https://webflow.com',
      'https://webflow.com/dashboard',
      'https://webflow.com/?utm_campaign=brandjs',
      'https://webflow.com/discover/popular',
      'https://webflow.com/foo/bar?baz=1',
    ])
  })

  describe('_getLinks', () => {
    it('should return empty array if given emtpy results', () => {
      const links = _getLinks({})
      expect(links).toBeTruthy()
      expect(links.length).toEqual(0)
    })

    it('should get found links', () => {
      const results = {
        'https://webflow.com/#':
           { collectFontStats:
              { 'graphik, sans-serif': [Object],
                'syncopate, sans-serif': [Object],
                '"roboto mono", sans-serif': [Object] },
             collectLinks:
              [ 'https://webflow.com/#',
                'https://webflow.com/',
                'https://webflow.com/?utm_campaign=brandjs',
                'https://webflow.com/discover/popular#recent',
                'https://webflow.com/foo/bar?baz=1',]
           },
        'https://www.cicuro.com/#':
           { collectFontStats:
              { 'roboto, sans-serif': [Object],
                'roboto, helvetica, arial, sans-serif': [Object] },
             collectLinks:
              [ 'https://www.cicuro.com/home',
                'https://www.cicuro.com/help',
                'https://www.cicuro.com/lang/en',
                'https://www.cicuro.com/lang/es',
              ]
           },
      }
      const links = _getLinks(results)
      expect(links).toEqual([
        'https://webflow.com',
        'https://webflow.com/?utm_campaign=brandjs',
        'https://webflow.com/discover/popular',
        'https://webflow.com/foo/bar?baz=1',
        'https://www.cicuro.com/home',
        'https://www.cicuro.com/help',
        'https://www.cicuro.com/lang/en',
        'https://www.cicuro.com/lang/es',
      ])
    })
  })

  describe('_finalizeResults', () => {
    it('should reduce the total results', () => {
      const results = {
        'https://webflow.com/#':
           { collectFontStats:
              { 'graphik, sans-serif': { numChars: 10 },
                'syncopate, sans-serif': { numChars: 20 },
                '"roboto mono", sans-serif': { numChars: 30 } },
             collectLinks:
              [ 'https://webflow.com/#',
                'https://webflow.com/',
                'https://webflow.com/?utm_campaign=brandjs',
                'https://webflow.com/discover/popular#recent',
                'https://webflow.com/foo/bar?baz=1',]
           },
        'https://www.cicuro.com/#':
           { collectFontStats:
              { 'roboto, sans-serif': { numChars: 10},
                'syncopate, sans-serif': { numChars: 20 },
                'roboto, helvetica, arial, sans-serif': { numChars: 10} },
             collectLinks:
              [ 'https://www.cicuro.com/home',
                'https://www.cicuro.com/help',
                'https://www.cicuro.com/lang/en',
                'https://www.cicuro.com/lang/es',
              ]
           },
      }
      const finalizedResults = _finalizeResults(results)
      expect(finalizedResults).toEqual(
        {
          'errors': [],
          'fontStats': {
            'graphik, sans-serif': { 'numChars': 10 },
            'syncopate, sans-serif': { 'numChars': 40 },
            '"roboto mono", sans-serif': { 'numChars': 30 },
            'roboto, sans-serif': { 'numChars': 10 },
            'roboto, helvetica, arial, sans-serif': { 'numChars': 10 }
          },
          'numPages': 2
        }
      )
    })
  })
})
