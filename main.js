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
            var clientPath = path.join(argv.path, key);
            var mkClientDir = util.mkdirpSync(clientPath);
            if (mkClientDir.result) {

              _.each(_.keys(client), function(thingName) {
                var thing = client[thingName];
                var thingPath = path.join(clientPath, thingName);
                var mkThingDir = util.mkdirpSync(thingPath);
                if (mkThingDir.result) {

                  //now write the 3 docs
                  _.each(['thing', 'designDoc', 'schema'], function(prop) {
                    sem.increment();
                    var filePath = path.join(thingPath, prop + '.json');
                    var json = JSON.stringify(thing[prop], null, 2);
                    //make newline content git-friendly on disk
                    json = json.replace(/\\n/g, '\n\/\*-\*\/ ');
                    fs.writeFile(filePath, json, function(err) {
                      if (err) {
                        errors.push('Error writing file ' + filePath + '; err: ' + err);
                      }
                      sem.execute();
                    });
                  });

                } else {
                  errors.push(mkThingDir.err);
                }
              });
            } else {
              errors.push(mkClientDir.err);
            }
          }

          sem.execute();
        });
    });
  }
});