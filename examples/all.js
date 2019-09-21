var Promise = require('../Promise.js');

Promise.all([
    new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('First promise');
        }, 2000);
    }),
    new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('Second promise');
        }, 1000);
    }),
]).then(function (result) {
    console.log('1: ', result);
});

Promise.all([
    new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('First promise');
        }, 2000);
    }),
    new Promise(function (resolve, reject) {
        setTimeout(function () {
            reject('Second promise error');
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

// 3:  [ 1, 42 ]
// 4:  []
// 2:  Second promise error
// 1:  [ 'First promise', 'Second promise' ]