var {Promise} = require('../Promise.js');

module.exports = {
    resolved: function (value) {
        return Promise.resolve(value)
    },
    rejected: function (reason) {
        return Promise.reject(reason)
    },
    deferred: function () {
        var defer = {};
        defer.promise = new Promise(function (resolve, reject) {
            defer.resolve = resolve;
            defer.reject = reject;
        });
        return defer;
    }
};