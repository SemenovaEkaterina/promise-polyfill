var Promise = require('../Promise.js');

Promise.race([
    new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('Выполнится медленнее');
        }, 2000);
    }),
    new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('Выполнится быстрее');
        }, 1000);
    }),
]).then(function (result) {
    console.log('1: ', result);
});

Promise.race([
    1,
    new Promise(function (resolve, reject) {
        resolve(42);
    }),
]).then(function (result) {
    console.log('2: ', result);
});

// 2:  1
// 1:  Выполнится быстрее
