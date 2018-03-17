'use strict';

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _uuid = require('uuid');

var _ = require('./');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TEMP = _os2.default.tmpdir();

_fs2.default.readdir(TEMP, function (err, filenames) {
  var files = [];

  var l = filenames.length;
  while (l-- && files.length < 200) {
    var filename = filenames[l];
    var filepath = _path2.default.join(TEMP, filename);
    var file = _fs2.default.statSync(filepath);

    file.name = filename;
    file.path = filepath;

    if (file.isFile() && file.size > 100) {
      files.push(file);
    }
  }

  files.reduce(function (promise, file) {
    return promise.then(function () {
      return new Promise(function (resolve, reject) {
        var tempPath = _path2.default.join(TEMP, 'test-fs-proxy-' + new Date().getTime() + '-' + (0, _uuid.v4)());
        var sourceStream = _fs2.default.createReadStream(file.path);
        var tempStream = _fs2.default.createWriteStream(tempPath);

        sourceStream.pipe(new _2.default()).pipe(tempStream).on('error', reject).on('finish', function () {
          var source = _fs2.default.readFileSync(file.path);
          var temp = _fs2.default.readFileSync(tempPath);

          var result = source.equals(temp);
          console.log(result);
          if (!result) {
            console.error('files did not match');
            console.error(file.path);
            console.error(tempPath);
            throw new Error('files did not match');
          }
          resolve();
        });
      });
    });
  }, Promise.resolve());
});