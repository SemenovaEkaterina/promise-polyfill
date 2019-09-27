function getGlobal() {
    return typeof window != 'undefined' ? window : typeof global != 'undefined' ? global : typeof self != 'undefined' ? self : this;
}

(function (global) {
    const nativePromise = global['Promise'];
    const nativePromiseString = 'function Promise() { [native code] }';
    const hasNative = nativePromise && nativePromise.toString() === nativePromiseString;

    if (typeof exports !== 'undefined' && exports) {
        exports.Promise = hasNative ? nativePromise : Promise;
    } else {
        if (typeof define == 'function' && define.amd) {
            define(function () {
                return hasNative ? nativePromise : Promise;
            });
        } else {
            if (!hasNative) {
                global['Promise'] = Promise;
            }
        }
    }

    var STATUSES = {
        PENDING: 'pending',
        FULFILLED: 'fulfilled',
        REJECTED: 'rejected',
    };

    //----------------------------------------------------------------------
    // Конструктор
    //----------------------------------------------------------------------

    function Promise(func) {
        if (typeof func !== 'function') {
            throw TypeError(func + ' is not a function');
        }

        if (!this instanceof Promise) {
            throw new TypeError('Please use the \'new\' operator, this object constructor cannot be called as a function.');
        }

        this._status = STATUSES.PENDING;
        this._data = null;
        this._handlers = [];

        try {
            func(this._resolve.bind(this), this._reject.bind(this));
        } catch (e) {
            this._reject(e);
        }
    }

    Promise.prototype = {
        constructor: Promise,

        _resolve: function (result) {
            changeStatus(this, STATUSES.FULFILLED, result, arguments, 'resolve');
        },

        _reject: function (error) {
            changeStatus(this, STATUSES.REJECTED, error, arguments, 'reject');
        },

        then: function (onResolve, onReject) {
            // По спецификации then может не принимать агрументов
            return wait(this, onResolve, onReject);
        },

        catch: function (onReject) {
            // По спецификации reject может не принимать агрументов
            return this.then(null, onReject);
        },

        finally: function (onFinally) {
            return wait(this, null, null, onFinally);
        },

        done: function (onResolve, onReject) {
            return wait(this, onResolve, onReject, null, true);
        },
    };

    //----------------------------------------------------------------------
    // Утилиты
    //----------------------------------------------------------------------

    function isPromise(item) {
        return item instanceof Promise;
    }

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
    function callHandler(promise, returnPromise, handler, replaceResult) {
        var result = promise._data;
        var status = promise._status;
        var isHandlerFunction = handler && typeof handler === 'function';

        if (isHandlerFunction) {
            var handlerResult;
            try {
                handlerResult = handler(promise._data);
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

    function handle(promise, handlers) {
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

        const self = promise;

        setTimeout(function () {
            if (this._status === STATUSES.PENDING) {
                return;
            }

            (handlers || self._handlers).forEach(function (item) {
                var handler;

                if (item.onFinally) {
                    // onFinally возвращает результат в исходном виде: replaceResult = false
                    callHandler(self, item.returnPromise, item.onFinally, false);
                } else {
                    // остальные возвращают свой результат: replaceResult = true

                    switch (self._status) {
                        case STATUSES.FULFILLED:
                            handler = item.onResolve;
                            break;
                        case STATUSES.REJECTED:
                            handler = item.onReject;
                            break;
                    }

                    callHandler(self, item.returnPromise, handler, true);
                }
            });
        }, 0);
    }

    // args используется для вывода ошибки о том, что лишние аргументы resolve и reject будут проиногрированы
    function changeStatus(promise, status, data, args, name) {
        if (args && args.length > 1) {
            throw Error('Arguments in ' + name + ' will be ignored: ' + Object.values(args).slice(1).join(', '));
        }

        if (promise._status !== STATUSES.PENDING) {
            return;
        }

        promise._status = status;
        promise._data = data;

        handle(promise);
    }

    // then, catch, finally
    function wait(promise, onResolve, onReject, onFinally, done) {
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

        if (promise._status === STATUSES.PENDING) {
            promise._handlers.push(handler);
        } else {
            handle(promise, [handler]);
        }

        return returnPromise;
    }

    //----------------------------------------------------------------------
    // Методы класса
    //----------------------------------------------------------------------

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

    return Promise;
})(getGlobal());