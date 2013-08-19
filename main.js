var argv = require('optimist').argv,
  _ = require('underscore'),
  featherConfig = require('feather-config'),
  airborne = require('airborne_client'),
  fs = require('fs'),
  util = require('./lib/util'),
  Semaphore = require('./lib/semaphore'),
  path = require('path');

if (!argv.path) {
  console.log('Must provide --path argument which is the FULLY qualified path of the folder you wish to write the airborne database(s) to on disk. The directory must already exist.');
  process.exit(1);
}

function end(msg) {
  console.error(msg);
  process.nextTick(function() {
    process.exit(0);
  });
}

featherConfig.init({
  appDir: process.cwd()
}, function(err, config) {
  if (err) {
    
  } else {

    var airborneConfig = config.safeGet('airborne');
    if (!airborneConfig) return end('No airborne section found in config');

    //loop the configured airborne databases, create the client, and write all the thing docs to disk
    var errors = [];
    var sem = new Semaphore(function() {
      if (!errors.length) errors = 'none';
      end('Process complete. Errors: ' + JSON.stringify(errors, null, 2));
    });

    _.each(_.keys(airborneConfig), function(key) {
      var config = airborneConfig[key];
      if (config.enabled) {
        sem.increment();
        airborne.createClient(config, function(err, client) {
          if (err) {            
            errors.push('Error creating client "' + key + '". err: ' + err);          
          } else {

            //client was created, now loop through all the things and write to disk
            _.each(_.keys(client), function(thing) {

            });
          }

          sem.execute();
        });
    });
  }
});