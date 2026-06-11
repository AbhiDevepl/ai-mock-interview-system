import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../utils/axios";

/**
 * Initialize auth state on app mount.
 * Uses the pre-configured api instance (withCredentials: true)
 * to properly send the cookie on the very first request.
 */
export const initializeAuth = createAsyncThunk(
  "user/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const result = await api.get("api/auth/me");
      return result.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Authentication check failed",
      );
    }
  },
);

const initialState = {
  userData: null,
  loading: true,
  initialized: false,
  isAuthenticated: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
      state.loading = false;
      state.initialized = true;
      state.isAuthenticated = true;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.initialized = true;
      state.isAuthenticated = false;
    },
    clearUser: (state) => {
      state.userData = null;
      state.loading = false;
      state.initialized = true;
      state.isAuthenticated = false;
      state.error = null;
    },
    resetUser: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.userData = action.payload;
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.userData = null;
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { setUserData, setLoading, setError, clearUser, resetUser } = userSlice.actions;

export const selectUser = (state) => state.user.userData;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;
export const selectIsLoading = (state) => state.user.loading;
export const selectIsInitialized = (state) => state.user.initialized;
export const selectUserError = (state) => state.user.error;

export default userSlice.reducer;
