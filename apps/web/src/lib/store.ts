import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/base-api';

/** A new store per request on the server, so state never leaks between people. */
export function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
