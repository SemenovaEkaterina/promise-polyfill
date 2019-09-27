global.Promise = undefined;

var {Promise} = require('../Promise.js');

var p = Promise.resolve('foo');

p.then(function (value) {
    console.log(value); // "foo"
});

p.done(function (value) {
    throw new Error('Ooops!'); // thrown in next tick
});