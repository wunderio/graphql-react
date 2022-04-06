'use strict';

const ReactDOMServer = require('react-dom/server');

const GraphQL = require('../universal/GraphQL');

const arrayFlat = require('../universal/private/arrayFlat');

module.exports = async function ssr(
  graphql,
  node,
  render = ReactDOMServer.renderToStaticMarkup
) {
  if (!(graphql instanceof GraphQL))
    throw new TypeError('ssr() argument 1 must be a GraphQL instance.');
  if (arguments.length < 2)
    throw new TypeError('ssr() argument 2 must be a React node.');
  if (typeof render !== 'function')
    throw new TypeError('ssr() argument 3 must be a function.');
  graphql.ssr = true;

  async function recurse() {
    const string = render(node);
    const cacheValuePromises = arrayFlat(Object.values(graphql.operations));

    if (cacheValuePromises.length) {
      await Promise.all(cacheValuePromises);
      return recurse();
    } else {
      delete graphql.ssr;
      return string;
    }
  }

  return recurse();
};
