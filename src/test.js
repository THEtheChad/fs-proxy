import os from 'os'
import fs from 'fs'
import path, { resolve } from 'path'
import { v4 } from 'uuid'
import FSProxy from './'

const TEMP = os.tmpdir()

fs.readdir(TEMP, (err, filenames) => {
  const files = []

  let l = filenames.length
  while (l-- && files.length < 200) {
    const filename = filenames[l]
    const filepath = path.join(TEMP, filename)
    const file = fs.statSync(filepath)

    file.name = filename
    file.path = filepath

    if (file.isFile() && file.size > 100) {
      files.push(file)
    }
  }

  files.reduce((promise, file) => {
    return promise.then(() => new Promise((resolve, reject) => {
      const tempPath = path.join(TEMP, `test-fs-proxy-${(new Date).getTime()}-${v4()}`)
      const sourceStream = fs.createReadStream(file.path)
      const tempStream = fs.createWriteStream(tempPath)

      sourceStream
        .pipe(new FSProxy)
        .pipe(tempStream)
        .on('error', reject)
        .on('finish', () => {
          const source = fs.readFileSync(file.path)
          const temp = fs.readFileSync(tempPath)

          const result = source.equals(temp)
          console.log(result)
          if (!result) {
            console.error('files did not match')
            console.error(file.path)
            console.error(tempPath)
            throw new Error('files did not match')
          }
          resolve()
        })
    }))
  }, Promise.resolve())
})