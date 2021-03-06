var {Promise} = require('../Promise.js');

new Promise((resolve, reject) => {
    setTimeout(() => resolve("Результат"), 1000)
}).finally(function () {
    console.log("Промис завершён");
}).then(function (result) {
    console.log(result);
});

new Promise((resolve, reject) => {
    throw new Error("Ошибка");
}).finally(function () {
    console.log("Промис завершён");
}).catch(function (error) {
    console.log(error.name);
});

// Промис завершён
// Error
// Промис завершён
// Результат
