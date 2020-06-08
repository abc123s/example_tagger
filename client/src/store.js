import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import { batchedSubscribe } from 'redux-batched-subscribe';
import { autoRehydrate, persistStore } from 'redux-persist';
import localForage from 'localforage';

import reducer, { REHYDRATED } from './reducers/reducers';

/*
// special logger without extra stuff
const logger = createLogger({
  level: {
    prevState: false,
    nextState: false,
  },
});
*/

const logger = createLogger();

const logs = true;

// THIS WORKS, BUT I DON'T KNOW WHY!!! Taken from:
// http://jamesknelson.com/can-i-dispatch-multiple-actions-from-redux-action-creators/
const createStoreWithMiddleware =
  process.env.NODE_ENV !== 'production' && logs
    ? applyMiddleware(thunk, logger)(createStore)
    : applyMiddleware(thunk)(createStore);

// Ensure our listeners are only called once, even when one of the above
// middleware call the underlying store's `dispatch` multiple times
const batchingStore = batchedSubscribe(fn => fn())(createStoreWithMiddleware);

// persist only if we can...
let store = null;
let enableLocalForage = true;
try {
  window.localStorage.setItem('__u', 'u');
} catch (e) {
  enableLocalForage = false;
}

let persistCompletePromise = Promise.resolve();
if (enableLocalForage) {
  const persistingStore = autoRehydrate()(batchingStore);
  store = persistingStore(reducer);
  persistCompletePromise = new Promise(resolve =>
    persistStore(
      store,
      {
        storage: localForage,
        whitelist: ['login', 'profile', 'recipe'],
      },
      () => {
        resolve();
        store.dispatch({ type: REHYDRATED });
      }
    )
  );
} else {
  store = batchingStore(reducer);
}

// export promise that resolves when persist completes
export const persistComplete = persistCompletePromise;

export default store;
