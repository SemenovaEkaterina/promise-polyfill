var Promise = require('../Promise.js');

var promise = new Promise(function (resolve, reject){
    resolve(42);
});

promise.done(function (error) {
    console.log('Будет проигннорировано', error);
}).then(function () {
    console.log('Будет проигннорировано');
}).catch(function (error) {
    console.log('Будет проигннорировано');
}).done(function () {
    console.log('Будет проигнорировано');
});