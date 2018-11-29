const {
  addIndex,
  F,
  forEach,
  flatten,
  fromPairs,
  map,
  pair,
  partial,
  partialRight,
  pathOr,
  tryCatch
} = require('ramda')


const Bluebird = require('bluebird')
const puppeteer = require('puppeteer')

const config = require('../config')

const PAGE_CONCURRENCY = config.get('analyzer:pageConcurrency') || 2
console.log('using page concurrency', PAGE_CONCURRENCY)

async function getBrowser() {
  const browser = await puppeteer.launch()
  return Bluebird.resolve(browser).disposer(async (browser, promise) => {
    try {
      await browser.close()
    } catch (e) {
      console.warn('Problem closing down browser', e.stack)
    }
    return promise
  })
}

async function withBrowser(func) {
  return Bluebird.using(getBrowser(), func)
}

/**
 * convert array of urls to a results object
 *
 * [ 'a', 'b', ... ]  -->  { 'a': {}, 'b': {} ... }
 */
const toResultsObj = (urls) => (
  fromPairs(
    map(
      partialRight(
        pair, [{}]
      )
    )(urls)
  )
)

async function analyzePages(pageUrls, analyzers, callback = F) {
  const analyze = partialRight(analyzePagesWithBrowser, [pageUrls, analyzers, callback])
  return withBrowser(analyze)
}

async function analyzePagesWithBrowser(browser, pageUrls, analyzers, callback = F) {
  pageUrls = flatten([pageUrls])
  analyzers = flatten([analyzers])
  const results = toResultsObj(pageUrls)

  await Bluebird.map(pageUrls, async (url) => {
    console.log('analyzing page', url)
    const page = await browser.newPage()
    try {
      await page.goto(url)
      const analyzersResult = await analyzePage(page, analyzers)
      results[url] = analyzersResult
    } catch (e) {
      results[url].error = e.message
    } finally {
      tryCatch(page.close, F)
    }

    try {
      callback(url, results[url])
    } catch (e) {
      console.warn('error while calling callback', e.stack)
    }
    return results
  }, { concurrency: PAGE_CONCURRENCY })

  return results
}

async function analyzePage(page, analyzers) {
  const result = {}

  await Bluebird.each(analyzers, async (analyzer, idx) => {
    const analyzerName = pathOr(idx, ['prototype', 'constructor', 'name'], analyzer)
    const text = `var __flow${analyzerName} = ${analyzer.toString()}; __flow${analyzerName}(window);`
    const analyzerResults = await page.evaluate(text)
    result[analyzerName] = analyzerResults
  })

  return result
}

module.exports = {
  withBrowser,
  analyzePages,
  analyzePagesWithBrowser,
}
