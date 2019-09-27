var {Promise} = require('../Promise.js');

var promise = new Promise(function (resolve, reject){
    reject(42)
});

promise.then(function () {
    console.log('Будет проигнорировано');
}).then(function () {
    console.log('Будет проигнорировано тоже');
}).catch(function () {
    console.log('Ошибка обработана');
});