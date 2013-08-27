var _ = require('underscore'),
  airborne = require('airborne_client'),
  fs = require('fs'),
  util = require('../util'),
  Semaphore = require('../semaphore'),
  path = require('path'),
  request = require('request');

var newlineRegex = /\n\/\*-\*\/\s/g;

module.exports = {

  restore: function(pathOnDisk, airborneConfig, cb) {
    //loop the configured airborne databases, create the client, read thing definition docs from disk, send them to airborne to be saved to the database
    var errors = [];
    var sem = new Semaphore(function() {
      if (!errors.length) errors = null;
      cb(errors, 'Restore complete.');
    });

    _.each(_.keys(airborneConfig), function(key) {
      var config = airborneConfig[key];
      if (config.enabled) {
        sem.increment();
        airborne.createClient(config, function(err, client) {
          if (err) {            
            errors.push('Error creating client "' + key + '". err: ' + err);
          } else {

            //client was created, now loop through all the things, read/parse from disk, and send to airborne
            var clientPath = path.join(pathOnDisk, key),
              dirs = fs.readdirSync(clientPath);

            if (dirs && dirs.length) {
              _.each(dirs, function(dir) { //NOTE: doing sync file stuff here as it's a run-once command, not a server so it's ok
                try {
                  var dirPath = path.join(clientPath, dir),
                    thingPath = path.join(dirPath, 'thing.json'),
                    designDocPath = path.join(dirPath, 'designDoc.json');

                  var thingJSON = fs.readFileSync(thingPath, 'utf8');
                  thingJSON = thingJSON.toString().replace(newlineRegex, '\\n');

                  var thing = JSON.parse(thingJSON);

                  var designDocJSON = fs.readFileSync(designDocPath, 'utf8');
                  designDocJSON = designDocJSON.toString().replace(newlineRegex, '\\n');

                  var designDoc = JSON.parse(designDocJSON);

                  //attach designDoc to thing before sending to airborne
                  thing.designDoc = designDoc;

                  //send the request to airborne to persist the thing
                  sem.increment();
                  request({
                    method: 'POST',
                    uri: config.url + '/_rest/airborne/thing/',
                    json: thing
                  }, function(err, res, body) {
                    if (err) {
                      errors.push('Error in response from airborne while saving thing ' + thing._id + '; err: ' + err);
                    } else if (res.statusCode !== 200) {
                      errors.push('Error in response from airborne while saving thing ' + thing._id + '; statusCode: ' + res.statusCode);
                    }

                    sem.execute();
                  });
                } catch (ex) {
                  errors.push('Error reading/parsing thing at path ' + dirPath + '; err: ' + ex.message);
                }
              });
            }
          }

          sem.execute();
        });
      }
    });
  }
};