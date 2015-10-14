/**
 * ElasticSearch instance ready to use
 */
var elasticsearch = require('elasticsearch');
var cfg = require('./cfg');


exports = module.exports = new elasticsearch.Client({
  host: cfg.elastic.host,
  log: cfg.elastic.log

  //requestTimeout: 60000
});
