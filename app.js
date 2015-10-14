var fs = require('fs');
var url = require('url');
var http = require('http');
var extend = require('extend');

var cfg = require('./config/cfg');

var utils = require('./lib/utils');

var es = require('././config/es');

var errHandler = function() {
    console.log('Error:', arguments);
    process.exit(1);
};

// Video ids if elasticsearch is down
var ids = fs.readFileSync('data').toString().split('\n');

utils.shuffleArray(ids);
var length = ids.length;

var current = 0;

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
    for (var i = 0; i < cfg.app.resultIdCount; i++) {
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

    if (is_elastic_enabled) {
        es.search({
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

            utils.shuffleArray(data);

            var newData = [];
            for (var i = 0; i < Math.min(data.length, cfg.app.resultIdCount); ++i) {
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
var waitForElastic = process.argv[2] == 'force-elastic';

var is_elastic_enabled = false;
function runServer() {
    console.log('Start node app listening on %d port', cfg.env.port);
    server.listen(cfg.env.port);
}

if(waitForElastic) {
    utils.waitForElastic()
        .then(function () {
            console.log('Elasticsearch enabled!');
            is_elastic_enabled = true;
            runServer();
        }, errHandler).catch(errHandler);
} else {
    console.log('Using static database.');
    runServer();
}
