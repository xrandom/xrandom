var Q = require('q');
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var path = require('path');

var es = require('../config/es');

var utils = require('../lib/utils');

var relPath = function (fname) {
  return path.join(path.resolve(__dirname, '..'), fname);
};

var log = console.log;
var logCb = function () {
  log.apply(this, arguments);
};

var errHandler = function() {
  console.log('Error:', arguments);
  process.exit(1);
};

var prepareIndices = function () {
  return es.indices.delete({
    index: 'videos',
    ignore: 404
  }).then(es.indices.create({
    index: 'videos',
    ignore: 400
  }));
};

var i = 0;
var addToIndex = function (id, keywords, cb) {
  var retry = function () {
    setTimeout(function () {
      addToIndex(id, keywords, cb);
    }, 1000);
  };
  
  es.index({index: 'videos', type: 'eporner', id: id, body: {
    keywords: keywords
  }}).then(function () {
    log(id, '[', ++i,']');
    cb();
  }).error(retry).catch(retry);
};

function writeId(id) {
  if(!this.constructor.writer) {
    this.constructor.writer = fs.createWriteStream(relPath('data'));
  }
  var writer = this.constructor.writer;
  
  if(!writer.write(id + '\n', 'utf8')) {
    writer.once('drain', function () {
      writeId(id);
    });
  }
}

var processXml = function (dbPath) {
  return prepareIndices().then(function () {
    var data = fs.readFileSync(dbPath);
    log('reading database from fs...');
    $ = cheerio(data.toString('utf8'), {normalizeWhitespace: true, xmlMode: true});
    log('read database. start populating elasticsearch...');
    var movies = $.find('movie');
    var left = movies.length;
    
    $.find('movie').each(function (edx, el) {
      el = cheerio(this);
      
      var kw = el.find('keywords').text().split(','),
          id = el.find('id').text();
      
      addToIndex(id, kw, function () {
        // Write id to datafile. We're cool
        writeId(id);
        // Decrease left, so we can know if finished
        if(--left == 0) {
          log('Everything done. Exiting.');
          es.close();  // It doesn't exit actually
          process.exit();
        }
      });
    });
  }, errHandler);
};

var dataPath = relPath('data.xml');

var hasData = true;
try{
  fs.statSync(dataPath);
} catch (e) {
  hasData = false;
}

var runImport = function () {
  utils.waitForElastic()
      .then(function () {
        processXml(dataPath);
      }, errHandler);
};

if(hasData) {
  runImport();
} else {
  var writeStream = fs.createWriteStream(dataPath);

  log('Start data downloading... This may take a lot of time');

  request
      .get('http://www.eporner.com/api_xml/all/1000000')
      .on('response', function(response) {
        log('Data downloaded. Start processing.'); // 200

        runImport();
      })
      .on('error', errHandler)
      .pipe(writeStream);
}