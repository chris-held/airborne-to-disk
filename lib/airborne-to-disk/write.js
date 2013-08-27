var _ = require('underscore'),
  airborne = require('airborne_client'),
  fs = require('fs'),
  util = require('../util'),
  Semaphore = require('../semaphore'),
  path = require('path');

module.exports = {

  write: function(pathOnDisk, airborneConfig, cb) {
    //loop the configured airborne databases, create the client, and write all the thing docs to disk
    var errors = [];
    var sem = new Semaphore(function() {
      if (!errors.length) errors = null;
      cb(errors, 'Writing complete.');
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
            var clientPath = path.join(pathOnDisk, key);
            var mkClientDir = util.mkdirpSync(clientPath);
            if (mkClientDir.result) {

              _.each(_.keys(client), function(thingName) {
                if (thingName.indexOf('ab_system') == -1) {
                  var thing = client[thingName];
                  var thingPath = path.join(clientPath, thingName);
                  var mkThingDir = util.mkdirpSync(thingPath);
                  if (mkThingDir.result) {

                    //now write the 3 docs
                    _.each(['thing', 'designDoc', 'schema'], function(prop) {
                      sem.increment();
                      var filePath = path.join(thingPath, prop + '.json');
                      var json = JSON.stringify(thing[prop], null, 2);
                      //make newline content git-friendly on disk (which means "easier for a human to read diffs")
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
                }
              });
            } else {
              errors.push(mkClientDir.err);
            }
          }

          sem.execute();
        });
      }
    });
  }
};