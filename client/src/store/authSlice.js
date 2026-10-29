import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAccessToken, getAccessToken } from '../services/api';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.data?.mfaRequired) {
        return {
          mfaRequired: true,
          mfaToken: response.data.data.mfaToken,
          user: response.data.data.user,
        };
      }
      const { user, accessToken } = response.data.data;
      setAccessToken(accessToken);
      return { user, accessToken };
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = errorData?.message || 'Login failed';
      if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
        const messages = errorData.errors.map((e) => (typeof e === 'object' && e.message ? e.message : String(e)));
        errorMsg = messages.join('. ');
      }
      return rejectWithValue(errorMsg);
    }
  }
);

export const verifyMfa = createAsyncThunk(
  'auth/verifyMfa',
  async ({ mfaToken, code }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/mfa/verify', { mfaToken, code });
      const { user, accessToken } = response.data.data;
      setAccessToken(accessToken);
      return { user, accessToken };
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = errorData?.message || 'MFA verification failed';
      return rejectWithValue(errorMsg);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const payload = { ...userData };
      if (!payload.phone) delete payload.phone;
      if (!payload.referralCode) delete payload.referralCode;
      if (!payload.shopQrToken) delete payload.shopQrToken;

      const response = await api.post('/auth/register', payload);
      const { user, accessToken } = response.data.data;
      setAccessToken(accessToken);
      return { user, accessToken };
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = errorData?.message || 'Registration failed';
      if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
        const messages = errorData.errors.map((e) => (typeof e === 'object' && e.message ? e.message : String(e)));
        errorMsg = messages.join('. ');
      }
      return rejectWithValue(errorMsg);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data.user;
    } catch (err) {
      setAccessToken(null);
      return rejectWithValue('Session expired');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    // Ignore error on logout
  } finally {
    setAccessToken(null);
  }
});

const initialState = {
  user: null,
  accessToken: getAccessToken(),
  isAuthenticated: Boolean(getAccessToken()),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    updateCoinBalance: (state, action) => {
      if (state.user) {
        state.user.fairCoinBalance = action.payload;
      }
    },
    updateSuperCoins: (state, action) => {
      if (state.user) {
        state.user.superCoinBalance = action.payload;
      }
    },
    setAuthUser: (state, action) => {
      state.user = action.payload?.user || action.payload;
      state.isAuthenticated = true;
      if (action.payload?.accessToken) {
        state.accessToken = action.payload.accessToken;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.mfaRequired) {
          state.isAuthenticated = false;
          state.mfaPending = true;
          state.mfaToken = action.payload.mfaToken;
          state.user = action.payload.user;
        } else {
          state.isAuthenticated = true;
          state.mfaPending = false;
          state.mfaToken = null;
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Verify MFA
      .addCase(verifyMfa.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyMfa.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.mfaPending = false;
        state.mfaToken = null;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(verifyMfa.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Me
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuthError, updateCoinBalance, updateSuperCoins, setAuthUser } = authSlice.actions;
export default authSlice.reducer;
