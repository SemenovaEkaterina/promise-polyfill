# promise-polyfill

1. Код написан на es5, подключен eslint для валидации
1. В папке `examples` приведены примеры использования
1. Полифил реализование внутри IIFE
1. Используется модуль для тестирования

### Функционал:
1. Создание промиса;
1. `then`, `chaining`;
1. `catch`;
1. `Promise.all`, `Promise.race`, `Promise.resolve`, `Promise.reject`;
1. `finally`,
1. `done`.

### Реализация
Модуль экспортирует функицию конструктор промисов.
В конструкторе сразу выполняется переданная функция, вызывая методы объекта `_resolve` и `_reject`, которые меняют состояние 
промиса и вызывают обработку накопленных обработчиков (функция `handle`).

Функция `handle` вызывает обработчики в зависимости от текущего статуса, для каждого обработчика вызывается `callHandler`, 
где обработывается результат и резолвится/реджектиться в возвращаемый промис.

Функция `wait` (которую с разными параметрами вызывают `then`, `catch`, `finally`) сохраняет в массив обработчиков переданное 
значение и возвращает пустой промис. Его состояние изменится после получения результата текущего промиса.

Функция `handlePromisesArray` производит перебор и накопление результатов массива промисов.
Используется в `Promise.all` и `Promise.race`.

### Тестирование
Используется пакет `promises-aplus-tests`, который содержит набор тестов, которые проверяют соотвествие реализации 
спецификации Promises / A +.
Не проходят тесты, связанные с обработкой thenable объектов.

1. `npm i`
1. `npm run test`

### Метод `done`
Не создает возвращаемый промис и выбрасывает ошибку в случае ее возникновения.
Добавлены методы `callReturnResolve`, `callReturnReject` для корректного вызова resolve, reject, ошибки на возвращаемых промисах.