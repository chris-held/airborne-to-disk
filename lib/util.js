var path = require('path'),
  fs = require('fs');

module.exports = {
  mkdirpSync: function(_path, mode) {
    mode = mode || 0755;

    if (!_path || _path.length < 1) {
      return {result:false, err:"path is required"};
    } else {

      var absolute = path.resolve(_path),
          parts = absolute.split(path.sep),
          curr = parts[0] || path.resolve(path.sep);

      while (parts.length > 0) {
        curr = path.resolve(curr, parts.shift());
        if (! path.existsSync(curr)) {
          try {
            fs.mkdirSync(curr, mode);
          } catch (ex) {
            console.error(ex.message);
            return {result:false, err:ex.message};
          }
        }
      }
      return {result:true};
    } // end else
  }
};