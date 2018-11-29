# Font Family Scraper

Given a URL input, scrape the webpage and its related files to find all fonts being used on the site.

## Setup

```
npm install
```

### Configuration

Default configuration options are in `config/default.json5`. To ovveride,
use environment variables or override with a local configuration `config/local.json5` or an environment speific configuration file (e.g. config/development.json5)


## Start up

```
npm start
```

in dev mode
```
npm run dev
```

## API

### request
```
 GET /analyze
   params:
     - url: Required. Url of the page to analyze.
     - depth: Optional. The degree to which to analyze linked pages. Default is 1.
     - limit: Optional. The number of pages to limit your results to.  Default is 100. (not implemented yet!)
```

### response

The response will be progressively written to as pages are analyzed.  For each
page that is analyzed, the results are returned in the following way:

```
[
  {url: 'http://www.webflow.com', result: { collectFonStats: {...}, collectLinks: [...]},
  {url: 'http://foo.bar/baz', error: 'error details'},
  ...
]
```

Overall results are returned when all pages have been analyzed and look
something like:

```
{
  "errors":[
    {"url":"https://webflow.com/legal/privacy","error":"Evaluation failed..."},
    ...
  ],
  "fontStats":{
    "graphik, sans-serif":{"numChars":197317},
    "syncopate, sans-serif":{"numChars":3006},
    "\"roboto mono\", sans-serif":{"numChars":6315},
    ...
  },
  "analyzedPages":[
    "https://www.webflow.com",
    "https://webflow.com",
    "https://webflow.com/designer",
    ...
  ],
  numPages":34
}
```



## Demo

![demo](https://user-images.githubusercontent.com/33014/48678630-af42be80-eb53-11e8-9a53-067458f9cac5.gif)
