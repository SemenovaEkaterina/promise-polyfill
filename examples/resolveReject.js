var Promise = require('../Promise');

Promise.resolve("Result").then(function (result) {
    console.log("RESOLVE: ", result);
});

Promise.reject('Error').catch(function (error) {
    console.log("CATCH: ", error);
});