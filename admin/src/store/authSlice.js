import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const loginAsync = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data: response } = await api.post('/auth/admin/login', credentials);
    // API wraps payload in response.data: { token, user }
    const payload = response.data || response;
    localStorage.setItem('acx_admin_token', payload.token);
    localStorage.setItem('acx_admin_user', JSON.stringify(payload.user));
    return payload;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const logoutAsync = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('acx_admin_token');
  return null;
});

const _raw = localStorage.getItem('acx_admin_token');
// Treat the stored string "undefined" or "null" as no token
const storedToken = (_raw && _raw !== 'undefined' && _raw !== 'null') ? _raw : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedToken ? JSON.parse(localStorage.getItem('acx_admin_user') || 'null') : null,
    token: storedToken,
    isAuthenticated: !!storedToken,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem('acx_admin_user', JSON.stringify(action.payload.user));
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
