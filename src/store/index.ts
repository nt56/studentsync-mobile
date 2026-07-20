import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { AppState } from "react-native";
import { baseApi } from "./api/base-api";
import authReducer from "./slices/auth-slice";
import bookmarkReducer from "./slices/bookmark-slice";
import filterReducer from "./slices/filter-slice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    filters: filterReducer,
    bookmarks: bookmarkReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch, (dispatch, { onFocus, onFocusLost }) => {
  const subscription = AppState.addEventListener("change", (state) => {
    dispatch(state === "active" ? onFocus() : onFocusLost());
  });
  return () => subscription.remove();
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
