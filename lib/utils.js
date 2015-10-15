var Q = require('q');
var es = require('./es');

var log = console.log;

exports = module.exports = {
  waitForElastic: function (waitCnt) {
    var waitCntDef = 50;
    waitCnt = waitCnt || 50;  // 40 requests by default

    var deferred = Q.defer();

    (function pinger(done) {
      if(waitCnt != waitCntDef) log('requests left', waitCnt);

      if(waitCnt-- == 0) {
        deferred.reject(new Error('Max requests exceeded, elastic is dead.'));
      }

      var repeat = function () {
        setTimeout(function () {
          log('Error establishing connection. Repeating...');
          pinger(done);
        }, 1000);
      };
      es.ping().then(done).error(repeat).catch(repeat);
    })(deferred.resolve);

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
