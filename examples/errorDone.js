var Promise = require('../Promise.js');

var promise = new Promise(function (resolve, reject){
    reject(42);
});

promise.done(function (error) {
    console.log('Обработка ошибки', error);
}).then(function () {
    console.log('Нет промиса');
});

// TypeError: Cannot read property 'then' of undefined