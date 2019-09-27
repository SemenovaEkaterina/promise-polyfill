var {Promise} = require('../Promise.js');

Promise.resolve("Result").then(function (result) {
    console.log("Then: ", result);
});

Promise.reject('Error').catch(function (error) {
    console.log("Catch: ", error);
});