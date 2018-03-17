'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _uuid = require('uuid');

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _buffer2 = require('buffer');

var _buffer3 = _interopRequireDefault(_buffer2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MAX_BUFFER_SIZE = _buffer3.default.constants.MAX_LENGTH; // give us a bit of headroom
var HOST = _os2.default.hostname();

var FSProxy = function (_stream$Duplex) {
  _inherits(FSProxy, _stream$Duplex);

  function FSProxy(opts) {
    _classCallCheck(this, FSProxy);

    var _this = _possibleConstructorReturn(this, (FSProxy.__proto__ || Object.getPrototypeOf(FSProxy)).call(this, opts));

    _this.filename = 'cache-' + HOST + '-' + new Date().getTime() + '-' + (0, _uuid.v4)();
    _this.filepath = _path2.default.join(_os2.default.tmpdir(), _this.filename);

    _this.fd = _fs2.default.openSync(_this.filepath, 'w+');
    _this.readPos = 0;
    _this.writePos = 0;
    _this.error = null;
    return _this;
  }

  _createClass(FSProxy, [{
    key: '_read',
    value: function _read() {
      var available = this.writePos - this.readPos;
      while (available > 0) {
        var bytesToRead = available;
        if (bytesToRead >= MAX_BUFFER_SIZE) {
          bytesToRead = MAX_BUFFER_SIZE;
        }
        var _buffer = Buffer.alloc(bytesToRead);

        var bytesRead = _fs2.default.readSync(this.fd, _buffer, 0, bytesToRead, this.readPos);
        available -= bytesRead;
        this.readPos += bytesRead;

        // if stream buffer is full, exit and wait for next read
        if (!this.push(_buffer)) return;
      }
    }
  }, {
    key: '_final',
    value: function _final(done) {
      // flush contents from buffer
      this._read();

      // terminate stream
      this.push(null);

      // clean up after ourselves
      _fs2.default.unlink(this.filepath, done);
    }
  }, {
    key: '_write',
    value: function _write(chunk, enc, done) {
      var _this2 = this;

      _fs2.default.write(this.fd, chunk, 0, chunk.length, this.writePos, function (err, bytes) {
        if (err) _this2.destroy(err);
        _this2.writePos += bytes;
        done();
      });
    }
  }]);

  return FSProxy;
}(_stream2.default.Duplex);

exports.default = FSProxy;