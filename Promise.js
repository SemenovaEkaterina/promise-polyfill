const nativePromise = Promise;
const nativePromiseSting = 'function Promise() { [native code] }';

module.exports = (function () {
    var STATUSES = {
        PENDING: 'pending',
        FULFILLED: 'fulfilled',
        REJECTED: 'rejected',
    };

    function isPromise(item) {
        return item && item.__proto__.constructor === Promise;
    }

    function Promise(func) {
        if (typeof func !== 'function') {
            throw TypeError(func + ' is not a function');
        }

        this.status = STATUSES.PENDING;
        this.data = null;
        this.handlers = [];
        var self = this;

        // В случае done нет возвращаемого промиса -> выбрасывать ошибку
        function callReturnReject(returnPromise, e) {
            if (returnPromise) {
                returnPromise._reject(e);
            } else {
                throw e;
            }
        }

        function callReturnResolve(returnPromise, result) {
            returnPromise && returnPromise._resolve(result);
        }

        /*
            В func попадает resolve/reject возвращаемого промиса в зависимости от статуса текущего промиса.
            В случае onFinally нужно в новый промис передавать текущий результат,
            для этого используется параметр replaceResult.
         */
        function callHandler(returnPromise, handler, replaceResult) {
            var result = self.data;
            var status = self.status;
            var isHandlerFunction = handler && typeof handler === 'function';

            if (handler && typeof handler === 'function') {
                var handlerResult;
                try {
                    handlerResult = handler(self.data);
                } catch (e) {
                    callReturnReject(returnPromise, e);
                }
                result = replaceResult ? handlerResult : result;
            }
            if (result && isPromise(result)) {
                result.then(function (result) {
                    callReturnResolve(returnPromise, result);
                }, function (error) {
                    callReturnReject(returnPromise, error);
                });
                // Иначе разрезолвим в возвращенный промис значение
            } else {
                // Если была обработка исключения, то резолвим результат
                if (isHandlerFunction && replaceResult) {
                    callReturnResolve(returnPromise, result);
                    // Иначе передаем с текщим статусом
                } else {
                    if (status === STATUSES.FULFILLED) {
                        callReturnResolve(returnPromise, result);
                    } else {
                        callReturnReject(returnPromise, result);
                    }
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
                            break;
                        case STATUSES.REJECTED:
                            handler = item.onReject;
                            break;
                    }

                    if (item.onFinally) {
                        // onFinally возвращает результат в исходном виде: replaceResult = false
                        callHandler(item.returnPromise, item.onFinally, false);
                    } else {
                        // остальные возвращают свой результат: replaceResult = true
                        callHandler(item.returnPromise, handler, true);
                    }
                });
            });
        }

        // args используется для вывода ошибки о том, что лишние аргументы resolve и reject будут проиногрированы
        function changeStatus(status, data, args, name) {
            if (args && args.length > 1) {
                throw Error('Arguments in ' + name + ' will be ignored: ' + Object.values(args).slice(1).join(', '));
            }

            if (self.status !== STATUSES.PENDING) {
                return;
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
        function wait(onResolve, onReject, onFinally, done) {
            /*
                Спецификация позволяет передавать в then, catch, finally не только функции,
                в таком случае в новый промис попадает результат старого
             */
            var returnPromise;
            if (!done) {
                returnPromise = new Promise(function (res, rej) {
                });
            }

            var handler = {
                returnPromise: returnPromise,
                onResolve: onResolve,
                onReject: onReject,
                onFinally: onFinally
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

        this.done = function (onResolve, onReject) {
            return wait(onResolve, onReject, null, true);
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
            return Promise.resolve([]);
        }
        var results = [];
        var handledCount = 0;
        var resultPromise = new Promise(function () {
        });

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
    // Закомментировано, чтобы работал метод done
    // if (nativePromise && nativePromise.toString() === nativePromiseSting) {
    //     return nativePromise;
    // }

    return Promise;
})();