const express = require('express')

const config = require('../config')

const port = config.get('server:port')

const { crawl } = require('../lib/crawler')

const app = express()



app.get('/analyze', async (req, res, next) => {
  console.log('GET', req.url)
  const { url, depth, pages, algorithym } = req.query
  if (!url) {
    res.status(400).json({
      error: 'url parameter is required',
    })
    return next()
  }

  res.setHeader('Content-Type', 'application/json');
  res.write('[')
  try {
    const finalResults = await crawl(url, { depth, algorithym }, (url, results) => {
      res.write(`${JSON.stringify({url: url, results: results })},`)
    })
    res.write(JSON.stringify(finalResults))
  } catch (e) {
    res.write(JSON.stringify({
      error: e.message,
      stack: e.stack,
    }))
    return next(e)
  } finally {
    res.write(']')
    res.end()
  }

  next()
})

app.listen(port, () => {
  console.log('server listening on port', port)
})
