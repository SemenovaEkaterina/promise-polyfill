var Promise = (function () {
    var STATUSES = {
        PENDING: 'pending',
        FULFILLED: 'fulfilled',
        REJECTED: 'rejected',
    };

    function isPromise(item) {
        return item && item.__proto__.constructor === Promise;
    }

    function Promise(func) {
        if (!func) {
            throw TypeError(func + ' is not a function');
        }

        this.status = STATUSES.PENDING;
        this.data = null;
        this.handlers = [];
        var self = this;

        /*
            В func попадает resolve/reject возвращаемого промиса в зависимости от статуса текущего промиса.
            В случае onFinally нужно в новый промис передавать текущий результат,
            для этого используется параметр replaceResult.
         */
        function callHandler(returnPromise, handler, func, replaceResult) {
            var result = self.data;
            var isHandlerFunction = handler && typeof handler === 'function';

            if (handler && typeof handler === 'function') {
                var handlerResult;
                try {
                    handlerResult = handler(self.data);
                } catch (e) {
                    returnPromise._reject(e);
                }
                if (handlerResult === self) {
                    throw TypeError('promise and result refer to the same object');
                }
                result = replaceResult ? handlerResult : result;
            }
            if (result && isPromise(result)) {
                result.then(function (result) {
                    returnPromise._resolve(result);
                }, function (error) {
                    returnPromise._reject(error);
                });
                // Иначе разрезолвим в возвращенный промис значение
            } else {
                // Если была обработка исключения, то резолвим результат
                if (isHandlerFunction && replaceResult) {
                    returnPromise._resolve(result);
                    // Иначе передаем с текщим статусом
                } else {
                    func(result);
                }
            }
        }

        function handle(handlers) {
            /*
                "Promises/A+ point 2.2.4:
                onFulfilled or onRejected must not be called until the execution context stack contains only platform
                code"

                promise.then(...)

                // <resolve moment>
                ...
                // Этот код выполняется раньше, чем код в then
                var a = 1;

             */

            setTimeout(function () {
                if (self.status === STATUSES.PENDING) {
                    return;
                }

                (handlers || self.handlers).forEach(function (item) {
                    var handler;
                    var returnAction;
                    switch (self.status) {
                        case STATUSES.FULFILLED:
                            handler = item.onResolve;
                            returnAction = item.returnPromise._resolve;
                            break;
                        case STATUSES.REJECTED:
                            handler = item.onReject;
                            returnAction = item.returnPromise._reject;
                            break;
                    }

                    if (item.onFinally) {
                        // onFinally возвращает результат в исходном виде: replaceResult = false
                        callHandler(item.returnPromise, item.onFinally, returnAction, false);
                    } else {
                        // остальные возвращают свой результат: replaceResult = true
                        callHandler(item.returnPromise, handler, returnAction, true);
                    }
                });
            });
        }

        // args используется для вывода ошибки о том, что лишние аргументы resolve и reject будут проиногрированы
        function changeStatus(status, data, args, name) {
            if (self.status !== STATUSES.PENDING) {
                return;
            }

            if (args.length > 1) {
                throw Error('Arguments in ' + name + ' will be ignored: ' + Object.values(args).slice(1).join(', '));
            }
            self.status = status;
            self.data = data;

            handle();
        }

        this._resolve = function (result) {
            changeStatus(STATUSES.FULFILLED, result, arguments, 'resolve');
        };

        this._reject = function (error) {
            changeStatus(STATUSES.REJECTED, error, arguments, 'reject');
        };

        // then, catch, finally
        function wait(onResolve, onReject, onFinally) {
            /*
                Спецификация позволяет передавать в then, catch, finally не только функции,
                в таком случае в новый промис попадает результат старого
             */

            var returnPromise = new Promise(function (res, rej) {
            });

            var handler = {
                returnPromise: returnPromise,
                onResolve: onResolve,
                onReject: onReject,
                onFinally: onFinally,
            };

            if (self.status === STATUSES.PENDING) {
                self.handlers.push(handler);
            } else {
                handle([handler]);
            }

            return returnPromise;
        }

        this.then = function (onResolve, onReject) {
            // По спецификации then может не принимать агрументов
            return wait(onResolve, onReject);
        };

        this.catch = function (onReject) {
            // По спецификации reject может не принимать агрументов
            return self.then(null, onReject);
        };

        this.finally = function (onFinally) {
            return wait(null, null, onFinally);
        };

        try {
            func(this._resolve, this._reject);
        } catch (e) {
            this._reject(e);
        }
    }

    // Реализация all и race
    function handlePromisesArray(promises, onlyFirst) {
        if (!promises.length) {
            return Promise._resolve([]);
        }
        var results = [];
        var handledCount = 0;
        var resultPromise = new Promise(function() {});

        promises.forEach(function (item, i) {
            function addResult(result) {
                if (onlyFirst) {
                    resultPromise._resolve(result);
                } else {
                    results[i] = result;
                    handledCount++;

                    if (handledCount === promises.length) {
                        resultPromise._resolve(results);
                    }
                }
            }

            if (isPromise(item)) {
                item.then(function (result) {
                    addResult(result);
                }, function (error) {
                    resultPromise._reject(error);
                });
            } else {
                addResult(item);
            }
        });

        return resultPromise;
    }

    Promise.all = function (promises) {
        return handlePromisesArray(promises, false);
    };

    Promise.race = function (promises) {
        return handlePromisesArray(promises, true);
    };

    Promise.resolve = function (value) {
        return new Promise(function (res) {
            res(value);
        });
    };

    Promise.reject = function (error) {
        return new Promise(function (res, rej) {
            rej(error);
        });
    };

    return Promise;
})();

module.exports = Promise;