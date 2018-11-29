const { URL } = require('url')

/**
 * analyzers: *may* be executed within a browser environemt.  Don't refer
 * to depedencies that are not available within the intended execution
 * environment. e.g. don't use Bluebird if it's not available where the
 * function will be ran.
 *
 * Each analyzer should accept a window object.
 */

/**
 * Given a browser window instance, collects stats about all used fonts in
 * the loaded document.
 */
function collectFontStats(window) {

  const ignoreElements = {
    STYLE: 1,
    SCRIPT: 1,
    AUDIO: 1,
    VIDEO: 1,
    LINK: 1,
    TITLE: 1,
    META: 1,
    HEAD: 1,
    TRACK: 1,
    MAP: 1,
    AREA: 1,
    IFRAME: 1,
  }
  const getComputedStyle = window.getComputedStyle
  const { TEXT_NODE, ELEMENT_NODE } = window.document
  const results = {}

  analyze(null, window.document.body)

  return results


  function analyze(parent, node) {
    if (isAnalyzable(node)) {
      collectStats(parent, node)
      const childNodes = node.childNodes
      for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i]
        analyze(node, childNode)
      }
    } else if (node.nodeType === TEXT_NODE) {
      return collectStats(parent, node)
    }
  }

  function isAnalyzable(node) {
    return ((node.nodeType === ELEMENT_NODE) && (!ignoreElements[node.nodeName]))
  }

  function collectStats(parent, node) {
    const stats = getFontStats(parent, node)
    if (node.nodeType === TEXT_NODE) {
      stats.numChars += node.nodeValue.replace(/\s/g, '').length
    }
  }

  function getFontStats(parent, node) {
    const element = node.nodeType === ELEMENT_NODE ? node : parent
    const fontFamily = (element.style.fontFamily || getComputedStyle(element).fontFamily).toLowerCase()
    // TODO: handled multiple values
    results[fontFamily] = results[fontFamily] || {numChars: 0}
    return results[fontFamily]
  }
}

function collectLinks(window) {
  const anchors = window.document.getElementsByTagName('a')
  return [].slice.call(anchors).filter((anchor) => {
    if (!anchor.href) {
      return false
    }
    const url = new URL(anchor.href)
    return new URL(anchor.href).hostname === window.location.hostname
  }).map((anchor) => {
    return anchor.href
  })
}

module.exports = {
  collectFontStats,
  collectLinks,
}
