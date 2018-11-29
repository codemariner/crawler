const URL = require('url')

const {
  compose,
  F,
  flatten,
  keysIn,
  map,
  not,
  nth,
  propOr,
  props,
  reduce,
  toPairs,
  uniq,
  values,
} = require('ramda')

const { analyzePagesWithBrowser, withBrowser } = require('./page-handler')
const { collectFontStats, collectLinks } = require('./analyzers')

const ALGORITHYM_DEPTH = 'depth'
const ALGORITHYM_BREADTH = 'breadth'

class AnalyzerContext {
  constructor(browser, analyzers) {
    this.browser = browser
    this.analyzers = analyzers

    this.results = {}
  }

  isProcessed(pageUrl) {
    return this.results[pageUrl]
  }

  registerResults(results) {
    Object.assign(this.results, results)
  }
}

async function crawl(url, options, callback = F) {
  const results = await withBrowser((browser) => {
    return run(url, options, callback, browser)
  })
  return results
}

async function run(url, { depth = 1, algorithym = ALGORITHYM_BREADTH }, callback, browser) {
  const analyzers = [ collectFontStats ]
  if (depth > 1) {
    analyzers.push(collectLinks)
  }

  url = _sanitizeUrl(url)
  const results = await analyzePagesWithBrowser(browser, url, analyzers, callback)

  if (depth <= 1) {
    return results
  }

  const context = new AnalyzerContext(browser, analyzers)
  context.registerResults(results)

  await breadth(context, results, depth, callback, 2)

  return _finalizeResults(context.results)
}


async function depth(results, context, depth, callback, level) {
  throw new Error('not implemented yet')
}

async function breadth(context, results, depth, callback, level) {
  const links = _getLinks(results)
  const newLinks = links.filter(compose(not, context.isProcessed.bind(context)))
  if (!newLinks) {
    return
  }
  const { browser, analyzers } = context
  const newResults = await analyzePagesWithBrowser(browser, newLinks, analyzers, callback)
  context.registerResults(newResults)

  if (depth > level) {
    return breadth(context, newResults, depth, callback, level++)
  }
  return newResults
}

const _finalizeResults = (results) => {
  const finalResults = {
    errors: [],
    fontStats: {
    },
    analyzedPages: [
    ],
    numPages: 0,
  }

  toPairs(results).forEach(([ url, result ]) => {
    finalResults.numPages++
    finalResults.analyzedPages.push(url)
    if (result.error) {
      finalResults.errors.push({
        url, error: result.error
      })
    }

    if (result.collectFontStats) {
      toPairs(result.collectFontStats).forEach(([ fontFamily, stats ]) => {
        const fontStats = finalResults.fontStats[fontFamily] || { numChars: 0 }
        fontStats.numChars += propOr(0, 'numChars', stats)
        finalResults.fontStats[fontFamily] = fontStats
      })
    }
  })
  return finalResults
}

/**
 * Collect links from analyzer results
 *
 *  results = {
 *    'https://webflow.com/#':
 *       { collectFontStats:
 *          { 'graphik, sans-serif': [Object],
 *            'syncopate, sans-serif': [Object],
 *            '"roboto mono", sans-serif': [Object] },
 *         collectLinks:
 *          [ 'https://webflow.com/#',
 *            'https://webflow.com/',
 *            'https://webflow.com/?utm_campaign=brandjs',
 *            'https://webflow.com/discover/popular#recent',
 *            'https://webflow.com/foo/bar?baz=1',]
 *        },
 *    ...
 *  }
 *
 * _getLinks(results) -->
 *
 *    [
 *      'https://webflow.com/',
 *      'https://webflow.com/?utm_campaign=brandjs',
 *      'https://webflow.com/discover/popular',
 *      'https://webflow.com/foo/bar?baz=1'
 *    ]
 */
const _getLinks = (results = {}) => (
  uniq(
    map(
      _sanitizeUrl,
      flatten(
        map(
          propOr([], 'collectLinks'),
          values(results)
        )
      )
    )
  )
)
function _sanitizeUrl(urlString) {
  const url = URL.parse(urlString)
  // consider using url.pathname or supporting an optional parameters for
  // how to crawl (url.pathname returns the path only, minus query string)
  return `${url.protocol}//${url.host}${url.path}`.replace(/\/+$/, '')
}

module.exports = {
  ALGORITHYM_DEPTH,
  ALGORITHYM_BREADTH,
  _finalizeResults,
  _getLinks,
  _sanitizeUrl,
  crawl,
}
