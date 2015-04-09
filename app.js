var fs = require('fs');
var url = require('url');
var http = require('http');
var extend = require('extend');
var elasticsearch = require('elasticsearch');

var config = require('./config/config.ex.js');
var localConfig = require('./config/config');

extend(true, config, localConfig);

// Video ids if elasticsearch is down
var ids = fs.readFileSync('data').toString().split('\n');

function shuffle(array) {
    var counter = array.length, temp, index;

    while (counter > 0) {
        index = Math.floor(Math.random() * counter);

        counter--;

        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
};

shuffle(ids);
var length = ids.length;

var current = 0;

var elastic = new elasticsearch.Client({
  host: config.elastic.host,
  log: 'trace'
});

var is_elastic_enabled = false;

elastic.ping({
  requestTimeout: 1000,
}, function (error) {
  if (error) {
    console.log('Elasticsearch cluster is down!');
  } else {
    console.log('Elasticsearch enabled!');
    is_elastic_enabled = true;
  }
});

var writeData = function(data, response, is_elastic) {
    response.writeHead(200, {
        'Content-Type': 'application/json'
    });

    response.end(JSON.stringify({
        ids: data,
        search_success: is_elastic
    }));    
};

// filter queries
var regex = /[^a-z\s\-\d]/gi;

var defaultResult = function(response, query, now) {
    var data = [];
    for (var i = 0; i < config.app.resultIdCount; i++) {
        data.push(ids[current]);
        current = (current + 1) % length;
    }

    writeData(data, response, !query && is_elastic_enabled);
    console.log('[%s] Takes: ', now.toISOString(), new Date() - now);
};

var server = http.createServer(function(request, response) {
    var query = decodeURI(request.url).replace(regex, '');
    var now = new Date();

    var gay = query.indexOf('gay') === -1 ? ' -gay' : '';
    var tranny = query.indexOf('trans') === -1 ? ' -trans' : '';
    var shemale = query.indexOf('shemale') === -1 ? ' -shemale' : '';

    if (gay || tranny || shemale) {
        gay = '';
        tranny = '';
        shemale = '';
    }

    if (is_elastic_enabled) {
        elastic.search({
          index: 'videos',
          size: query ? 25 : 500,
          body: {
            query: {
                function_score : {
                    query : 
                    {         
                        query_string : {
                            fields : ["keywords"],
                            query : (query || 'hd') + gay + tranny + shemale,
                            default_operator: 'OR'
                        } 
                    },
                    random_score : { 
                        seed : Date.now()
                    }
                }
            }
          }
        }).then(function (resp) {
            var hits = resp.hits.hits;
            var data = hits.map(function(hit){
                return hit['_id'];
            });

            shuffle(data);

            var newData = [];
            for (var i = 0; i < Math.min(data.length, config.app.resultIdCount); ++i) {
                newData.push(data[i]);
            }

            writeData(newData, response, true);
            console.log('[%s] ES Takes: ', now.toISOString(), new Date() - now);
        }, function (error) {
            console.log('error', error);
            defaultResult(response, query, now);
        });
    } else {
        defaultResult(response, query, now);
    }
});

console.log('Start listening %d port', config.env.port);
server.listen(config.env.port); 
