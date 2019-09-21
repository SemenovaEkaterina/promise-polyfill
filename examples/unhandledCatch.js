var Promise = require('../Promise');

new Promise((resolve, reject) => {
    throw Error('Error');
});