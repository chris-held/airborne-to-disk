#!/usr/bin/env node

var argv = require('optimist').argv,
  featherConfig = require('feather-config'),
  api = {
    write: require('./lib/airborne-to-disk/write').write,
    restore: require('./lib/airborne-to-disk/restore').restore
  };

if (!argv.path) {
  console.log('Must provide --path argument which is the FULLY qualified path of the folder you wish to write/read the airborne database(s) to/from on disk. The directory must already exist.');
  process.exit(1);
}

//generic function to end the process with an exit message
function end(msg) {
  console.error(msg);
  process.nextTick(function() {
    process.exit(0);
  });
}

//need to read the config before doing anything else
featherConfig.init({
  appDir: process.cwd()
}, function(err, config) {
  if (err) {
    end('Could not read from config. err: ' + err);
  } else {

    var airborneConfig = config.safeGet('airborne');
    if (!airborneConfig) return end('No airborne section found in config');

    var method = 'write';
    if (argv.restore) method = 'restore';

    api[method](argv.path, airborneConfig, function(errors, resultStr) {
      if (errors) {
        resultStr += ' Errors: ' + JSON.stringify(errors, null, 2);
      }

      end(resultStr);
    });
  }
});