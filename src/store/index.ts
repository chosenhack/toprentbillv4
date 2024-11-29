import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import customersReducer from './slices/customersSlice';
import paymentsReducer from './slices/paymentsSlice';
import activityReducer from './slices/activitySlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'customers', 'payments', 'activity']
};

const persistedReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedReducer,
    customers: customersReducer,
    payments: paymentsReducer,
    activity: activityReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;