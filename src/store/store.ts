import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import quizzesReducer from './quizzesSlice';
import roomReducer from './roomSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quizzes: quizzesReducer,
    room: roomReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
