'use strict';

const React = require('react');
const createArgErrorMessageProd = require('../private/createArgErrorMessageProd.js');
const useCache = require('./useCache.js');

/**
 * Cancels an event.
 * @kind function
 * @name cancelEvent
 * @param {Event} event Event.
 * @ignore
 */
function cancelEvent(event) {
  event.preventDefault();
}

/**
 * A React hook to prevent a [cache]{@link Cache#store} entry from being pruned,
 * by canceling the cache entry deletion for
 * [prune events]{@link Cache#event:prune} with `event.preventDefault()`.
 * @kind function
 * @name useCacheEntryPrunePrevention
 * @param {CacheKey} cacheKey Cache key.
 * @example <caption>Ways to `import`.</caption>
 * ```js
 * import { useCacheEntryPrunePrevention } from 'graphql-react';
 * ```
 *
 * ```js
 * import useCacheEntryPrunePrevention from 'graphql-react/public/useCacheEntryPrunePrevention.js';
 * ```
 * @example <caption>Ways to `require`.</caption>
 * ```js
 * const { useCacheEntryPrunePrevention } = require('graphql-react');
 * ```
 *
 * ```js
 * const useCacheEntryPrunePrevention = require('graphql-react/public/useCacheEntryPrunePrevention.js');
 * ```
 */
module.exports = function useCacheEntryPrunePrevention(cacheKey) {
  if (typeof cacheKey !== 'string')
    throw new TypeError(
      typeof process === 'object' && process.env.NODE_ENV !== 'production'
        ? 'Argument 1 `cacheKey` must be a string.'
        : createArgErrorMessageProd(1)
    );

  const cache = useCache();

  React.useEffect(() => {
    const eventNamePrune = `${cacheKey}/prune`;

    cache.addEventListener(eventNamePrune, cancelEvent);

    return () => {
      cache.removeEventListener(eventNamePrune, cancelEvent);
    };
  }, [cache, cacheKey]);
};
