const Bluebird = require('bluebird')
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const jsdom = require('jsdom')
const { forEach } = require('ramda')


const { withBrowser, analyzePages } = require('../page-handler')

const { collectFontStats, collectLinks } = require('../analyzers')

const { JSDOM } = jsdom

describe('collectFontStats', () => {

  const url = `file://${path.join(__dirname, 'test1.html')}`

  it('should collect all font stats', async () => {
    const results = await withBrowser(async (browser) => {
      const page = await browser.newPage()
      await page.goto(url)
      const window = await page.evaluateHandle('window')
      return await page.evaluate(
        `${collectFontStats.toString()}; collectFontStats(window)`,
        window)

    })

    expect(results).toEqual({
      arial: { numChars: 13 },
      verdana: { numChars: 3 },
      helvetica: { numChars: 491 },
      symbol: { numChars: 8 },
      'space-cadet': { numChars: 22 }
    })
  })

  // TODO: when using jsdom, it doesn't seem to like to pick up the default body font
  //   puppet returns ->
  //      {"arial":{"numChars":504},"verdana":{"numChars":3},"symbol":{"numChars":8},"space-cadet":{"numChars":22}}}}
  //   while jsdom returns ->
  //      {"arial":{"numChars":0},"":{"numChars":504},"verdana":{"numChars":3},"symbol":{"numChars":8},"space-cadet":{"numChars":22}}
  // it('should be jsdom friendly', async () => {
  //   const url2 = `file://${path.join(__dirname, 'test-jsdom.html')}`
  //   // TODO: JSDOM.fromURL didn't like my file:// url
  //   const html = fs.readFileSync(path.join(__dirname, 'test-jsdom.html'))

  //   const puppetResults = await analyzePages(url2, collectFontStats)


  //   const dom = await new JSDOM(html, {
  //     pretendToBeVisual: true,
  //     resources: 'usable',
  //     runScripts: 'dangerously',
  //   })
  //   const jsdomResults = await collectFontStats(dom.window)
  // })
})

describe('collectLinks', () => {
  const url = `file://${path.join(__dirname, 'test1.html')}`

  it('should collect all links', async () => {
    const results = await withBrowser(async (browser) => {
      const page = await browser.newPage()
      await page.goto(url)
      return await page.evaluate(
        `${collectLinks.toString()}; collectLinks(window)`,
        window)
    })

    expect(results).toEqual([`file://${path.join(__dirname, 'test2.html')}`])
  })

//  TODO: href in jsdom doesn't behave the same as in browser elements
//        (where the href url is fully resolved
//   it('should work with jsdom', async () => {
//     const html = fs.readFileSync(path.join(__dirname, 'test1.html'))
// 
//     const dom = await new JSDOM(html, {
//       pretendToBeVisual: true,
//       resources: 'usable',
//       runScripts: 'dangerously',
//     })
//     const results = await collectLinks(dom.window)
//     expect(results).toEqual([`file://${path.join(__dirname, 'test2.html')}`])
//   })
})
