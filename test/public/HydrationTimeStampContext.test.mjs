import { strictEqual } from 'assert';
import { useContext } from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { jsx } from 'react/jsx-runtime.js';
import HydrationTimeStampContext from '../../public/HydrationTimeStampContext.js';
import assertBundleSize from '../assertBundleSize.mjs';

export default (tests) => {
  tests.add('`HydrationTimeStampContext` bundle size.', async () => {
    await assertBundleSize(
      new URL('../../public/HydrationTimeStampContext.js', import.meta.url),
      350
    );
  });

  tests.add('`HydrationTimeStampContext` used as a React context.', () => {
    const TestComponent = () => useContext(HydrationTimeStampContext);
    const contextValue = 'a';
    const testRenderer = ReactTestRenderer.create(
      jsx(HydrationTimeStampContext.Provider, {
        value: contextValue,
        children: jsx(TestComponent, {}),
      })
    );

    strictEqual(testRenderer.toJSON(), contextValue);
  });
};
