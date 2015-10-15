var extend = require('extend');

var config = require('./config.ex.js');
var localConfig = require('./config');

extend(true, config, localConfig);

module.exports = exports = config;