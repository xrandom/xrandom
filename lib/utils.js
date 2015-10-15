var Q = require('q');
var es = require('./es');

var log = console.log;

exports = module.exports = {
  waitForElastic: function(waitCounter) {
    var now = function() { return new Date().getTime(); };
    
    waitCounter = waitCounter || 2000;
    var REQUEST_TIMEOUT = 1000;

    var deferred = Q.defer();
    log('Entered', now());
    
    var pingUntilSuccessOrZeroCounter = function() {
      waitCounter--;
      console.log('Wait counter is', waitCounter);
      if (waitCounter === 0) {
        deferred.reject("Max requests exceeded " + now());
      } else {
        es
            .ping({
              requestTimeout: REQUEST_TIMEOUT
            })
            .then(deferred.resolve, pingUntilSuccessOrZeroCounter);
      }
    };

    pingUntilSuccessOrZeroCounter();

    return deferred.promise;
  },
  shuffleArray: function (array) {
    var counter = array.length, temp, index;

    while (counter > 0) {
      index = Math.floor(Math.random() * counter);

      counter--;

      temp = array[counter];
      array[counter] = array[index];
      array[index] = temp;
    }

    return array;
  }
};
