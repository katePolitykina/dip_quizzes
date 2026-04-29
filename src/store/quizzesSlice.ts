import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient, ApiError } from '../lib/apiClient';
import type { QuizDetailResponse, QuizSummaryResponse, QuizUpsertRequest } from '../types/api';

interface QuizzesState {
  items: QuizSummaryResponse[];
  activeQuiz: QuizDetailResponse | null;
  listStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  saveStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: QuizzesState = {
  items: [],
  activeQuiz: null,
  listStatus: 'idle',
  saveStatus: 'idle',
  error: null,
};

export const fetchQuizzes = createAsyncThunk(
  'quizzes/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await apiClient.listQuizzes();
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const fetchQuiz = createAsyncThunk(
  'quizzes/fetchOne',
  async (quizId: string, { rejectWithValue }) => {
    try {
      return await apiClient.getQuiz(quizId);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const saveQuiz = createAsyncThunk(
  'quizzes/save',
  async (
    payload: { id?: string; quiz: QuizUpsertRequest },
    { rejectWithValue }
  ) => {
    try {
      return payload.id
        ? await apiClient.updateQuiz(payload.id, payload.quiz)
        : await apiClient.createQuiz(payload.quiz);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const removeQuiz = createAsyncThunk(
  'quizzes/delete',
  async (quizId: string, { rejectWithValue }) => {
    try {
      await apiClient.deleteQuiz(quizId);
      return quizId;
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

const quizzesSlice = createSlice({
  name: 'quizzes',
  initialState,
  reducers: {
    clearActiveQuiz(state) {
      state.activeQuiz = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizzes.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.items = action.payload;
        state.listStatus = 'succeeded';
      })
      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.activeQuiz = action.payload;
      })
      .addCase(saveQuiz.pending, (state) => {
        state.saveStatus = 'loading';
        state.error = null;
      })
      .addCase(saveQuiz.fulfilled, (state, action) => {
        state.activeQuiz = action.payload;
        state.saveStatus = 'succeeded';
        const summary = {
          id: action.payload.id,
          title: action.payload.title,
          questionCount: action.payload.questions.length,
          createdAt: action.payload.createdAt,
          updatedAt: action.payload.updatedAt,
        };
        const existingIndex = state.items.findIndex((item) => item.id === summary.id);
        if (existingIndex >= 0) {
          state.items[existingIndex] = summary;
        } else {
          state.items.unshift(summary);
        }
      })
      .addCase(saveQuiz.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.error = action.payload as string;
      })
      .addCase(removeQuiz.fulfilled, (state, action) => {
        state.items = state.items.filter((quiz) => quiz.id !== action.payload);
        if (state.activeQuiz?.id === action.payload) {
          state.activeQuiz = null;
        }
      });
  },
});

export const { clearActiveQuiz } = quizzesSlice.actions;
export default quizzesSlice.reducer;
