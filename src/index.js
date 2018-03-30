import os from 'os'
import fs from 'fs'
import path from 'path'
import { v4 } from 'uuid'
import stream from 'stream'
import buffer from 'buffer'

const MAX_BUFFER_SIZE = buffer.constants.MAX_LENGTH // give us a bit of headroom
const HOST = os.hostname()

export default class FSProxy extends stream.Duplex {
  constructor(opts) {
    super(opts)

    this.filename = `cache-${HOST}-${(new Date).getTime()}-${v4()}`
    this.filepath = path.join(os.tmpdir(), this.filename)

    this.fd = fs.openSync(this.filepath, 'w+')
    this.readPos = 0
    this.writePos = 0
    this.error = null
  }

  _read() {
    let available = this.writePos - this.readPos
    while (available > 0) {
      let bytesToRead = available
      if (bytesToRead >= MAX_BUFFER_SIZE) {
        bytesToRead = MAX_BUFFER_SIZE
      }
      const buffer = Buffer.alloc(bytesToRead)

      const bytesRead = fs.readSync(this.fd, buffer, 0, bytesToRead, this.readPos)
      available -= bytesRead
      this.readPos += bytesRead

      // if stream buffer is full, exit and wait for next read
      if (!this.push(buffer)) return
    }

    this.nextAvailable()
  }

  nextAvailable() {
    if (this.finished) return

    this.waiting = true
    this.once('available', () => {
      this.waiting = false
      this._read()
    })
  }

  _final(done) {
    this.finished = true

    // flush contents from buffer
    this._read()

    // terminate stream
    this.push(null)

    // clean up after ourselves
    fs.unlink(this.filepath, done)
  }

  _write(chunk, enc, done) {
    fs.write(this.fd, chunk, 0, chunk.length, this.writePos, (err, bytes) => {
      if (err) this.destroy(err)
      this.writePos += bytes
      done()
      if (this.waiting) this.emit('available')
    })
  }
}