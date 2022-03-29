'use strict';

var _objectWithoutPropertiesLoose = require('@babel/runtime/helpers/objectWithoutPropertiesLoose');

var _excluded = ['url'];

var mitt = require('mitt/dist/mitt');

var hashObject = require('./hashObject');

var graphqlFetchOptions = require('./private/graphqlFetchOptions');

module.exports = function GraphQL(_temp) {
  var _this = this;

  var _ref = _temp === void 0 ? {} : _temp,
    _ref$cache = _ref.cache,
    cache = _ref$cache === void 0 ? {} : _ref$cache;

  this.reload = function (exceptCacheKey) {
    _this.emit('reload', {
      exceptCacheKey: exceptCacheKey,
    });
  };

  this.reset = function (exceptCacheKey) {
    var cacheKeys = Object.keys(_this.cache);
    if (exceptCacheKey)
      cacheKeys = cacheKeys.filter(function (hash) {
        return hash !== exceptCacheKey;
      });
    cacheKeys.forEach(function (cacheKey) {
      return delete _this.cache[cacheKey];
    });

    _this.emit('reset', {
      exceptCacheKey: exceptCacheKey,
    });
  };

  this.operate = function (_ref2) {
    var operation = _ref2.operation,
      fetchOptionsOverride = _ref2.fetchOptionsOverride,
      _ref2$cacheKeyCreator = _ref2.cacheKeyCreator,
      cacheKeyCreator =
        _ref2$cacheKeyCreator === void 0 ? hashObject : _ref2$cacheKeyCreator,
      reloadOnLoad = _ref2.reloadOnLoad,
      resetOnLoad = _ref2.resetOnLoad;
    if (typeof cacheKeyCreator !== 'function')
      throw new TypeError(
        'operate() option “cacheKeyCreator” must be a function.'
      );
    if (reloadOnLoad && resetOnLoad)
      throw new TypeError(
        'operate() options “reloadOnLoad” and “resetOnLoad” can’t both be true.'
      );
    var fetcher =
      typeof fetch === 'function'
        ? fetch
        : function () {
            return Promise.reject(
              new TypeError('Global fetch API or polyfill unavailable.')
            );
          };
    var fetchOptions = graphqlFetchOptions(operation);
    if (fetchOptionsOverride) fetchOptionsOverride(fetchOptions);

    var url = fetchOptions.url,
      options = _objectWithoutPropertiesLoose(fetchOptions, _excluded);

    var cacheKey = cacheKeyCreator(fetchOptions);
    var resolveOperationsUpdated;
    var operationsUpdatedPromise = new Promise(function (resolve) {
      resolveOperationsUpdated = resolve;
    });
    var responsePromise = fetcher(url, options);
    var fetchResponse;
    var cacheValue = {};
    var cacheValuePromise = operationsUpdatedPromise.then(function () {
      return responsePromise
        .then(
          function (response) {
            fetchResponse = response;
            if (!response.ok)
              cacheValue.httpError = {
                status: response.status,
                statusText: response.statusText,
              };
            return response.json().then(
              function (_ref3) {
                var errors = _ref3.errors,
                  data = _ref3.data;
                if (!errors && !data)
                  cacheValue.parseError = 'Malformed payload.';
                if (errors) cacheValue.graphQLErrors = errors;
                if (data) cacheValue.data = data;
              },
              function (_ref4) {
                var message = _ref4.message;
                cacheValue.parseError = message;
              }
            );
          },
          function (_ref5) {
            var message = _ref5.message;
            cacheValue.fetchError = message;
          }
        )
        .then(function () {
          if (_this.operations[cacheKey].length > 1) {
            var operationIndex =
              _this.operations[cacheKey].indexOf(cacheValuePromise);

            if (operationIndex)
              return Promise.all(
                _this.operations[cacheKey].slice(0, operationIndex)
              );
          }
        })
        .then(function () {
          _this.cache[cacheKey] = cacheValue;

          _this.operations[cacheKey].splice(
            _this.operations[cacheKey].indexOf(cacheValuePromise) >>> 0,
            1
          );

          if (!_this.operations[cacheKey].length)
            delete _this.operations[cacheKey];

          _this.emit('cache', {
            cacheKey: cacheKey,
            cacheValue: cacheValue,
            response: fetchResponse,
          });

          return cacheValue;
        });
    });
    if (!_this.operations[cacheKey]) _this.operations[cacheKey] = [];

    _this.operations[cacheKey].push(cacheValuePromise);

    resolveOperationsUpdated();

    _this.emit('fetch', {
      cacheKey: cacheKey,
      cacheValuePromise: cacheValuePromise,
    });

    if (reloadOnLoad)
      cacheValuePromise.then(function () {
        _this.reload(cacheKey);
      });
    else if (resetOnLoad)
      cacheValuePromise.then(function () {
        _this.reset(cacheKey);
      });
    return {
      cacheKey: cacheKey,
      cacheValue: _this.cache[cacheKey],
      cacheValuePromise: cacheValuePromise,
    };
  };

  var _mitt = mitt(),
    on = _mitt.on,
    off = _mitt.off,
    emit = _mitt.emit;

  this.on = on;
  this.off = off;
  this.emit = emit;
  this.cache = cache;
  this.operations = {};
};
