import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  query: '',
  results: [],
  loading: false,
  error: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setResults: (state, action) => {
      state.results = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearSearch: (state) => {
      state.query = '';
      state.results = [];
      state.error = null;
    },
  },
});

export const { setQuery, setResults, setLoading, setError, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;