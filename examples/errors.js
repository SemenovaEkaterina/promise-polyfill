var Promise = require('../Promise.js');

// new Promise(1);
// TypeError: 1 is not a function

// new Promise((resolve, reject, info) => {});
// Error: Promise resolver has more than 2 arguments

// new Promise((resolve, reject) => {
//     resolve(42);
// }).then();
// Error: Then function has no arguments

// new Promise((resolve, reject) => {
//     resolve(42);
// }).then(1);
// TypeError: 1 is not a function

// new Promise((resolve, reject) => {
//     resolve(42, 32);
// }).then(function (result) {
//     console.log(1);
// });
// Error: Arguments inresolve will be ignored: 32