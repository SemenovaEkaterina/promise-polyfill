var Promise = require('../Promise.js');

var promise = new Promise(function (resolve){
    resolve(42)
});

promise
    .then(function (value) {
        return value + 1
    })
    .then(function (value) {
        console.log(value); // 43
        return new Promise(function (resolve) { resolve(137) })
    })
    .then(function (value) {
        console.log(value); // 137
        throw new Error()
    })
    .then(
        function () { console.log('Будет проигнорировано') },
        function () { return 'ошибка обработана' }
    )
    .then(function (value) {
        console.log(value) // "ошибка обработана"
    });