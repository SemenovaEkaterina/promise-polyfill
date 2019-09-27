var {Promise} = require('../Promise.js');

Promise.all([
    new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('Первый элемент');
        }, 2000);
    }),
    new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('Второй элемент');
        }, 1000);
    }),
]).then(function (result) {
    console.log('1: ', result);
});

Promise.all([
    new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('Результат будет проигнорирован');
        }, 2000);
    }),
    new Promise(function (resolve, reject) {
        setTimeout(function () {
            reject('Обработается ошибка');
        }, 1000);
    }),
]).then(function (result) {
    console.log(result);
}).catch(function (error) {
    console.log('2: ', error);
});

Promise.all([
    1,
    new Promise(function (resolve, reject) {
        resolve(42);
    }),
]).then(function (result) {
    console.log('3: ', result);
});

Promise.all([]).then(function (result) {
    console.log('4: ', result);
});

// 4:  []
// 3:  [ 1, 42 ]
// 2:  Обработается ошибка
// 1:  [ 'Первый элемент', 'Второй элемент' ]
