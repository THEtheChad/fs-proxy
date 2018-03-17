# stream-fs-proxy

steam-fs-proxy is a simple pass through stream that temporarily caches the input stream to the file system while the output stream is being processed. It's useful in a couple situations.

1. You have very slow output streams running in parallel but want to keep your memory footprint low.
2. You're piping from a network connection (http or https as examples) into a slow output stream where the backpressure might cause your connection to time out.

## Installation

```js
npm install stream-fs-proxy --save
```

```js
yarn add stream-fs-proxy
```

## Usage

```js
const FSProxy = require('stream-fs-proxy')

http.get('a-large-dataset', function(err, res) {
  res
    .pipe(new FSProxy)
    .pipe(new SlowProcess)
})
```
