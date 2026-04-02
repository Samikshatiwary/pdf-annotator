import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  highlights: [],
  selectedHighlight: null,
  loading: false,
  error: null,
};

const highlightsSlice = createSlice({
  name: 'highlights',
  initialState,
  reducers: {
    setHighlights: (state, action) => {
      state.highlights = action.payload;
      state.loading = false;
    },
    addHighlight: (state, action) => {
      state.highlights.push(action.payload);
    },
    updateHighlight: (state, action) => {
      const index = state.highlights.findIndex(h => h.uuid === action.payload.uuid);
      if (index !== -1) {
        state.highlights[index] = { ...state.highlights[index], ...action.payload };
      }
    },
    removeHighlight: (state, action) => {
      state.highlights = state.highlights.filter(h => h.uuid !== action.payload);
    },
    setSelectedHighlight: (state, action) => {
      state.selectedHighlight = action.payload;
    },
    addReaction: (state, action) => {
      const { highlightUuid, reaction } = action.payload;
      const highlight = state.highlights.find(h => h.uuid === highlightUuid);
      if (highlight) {
        if (!highlight.reactions) highlight.reactions = [];
        highlight.reactions.push(reaction);
      }
    },
    removeReaction: (state, action) => {
      const { highlightUuid, userId } = action.payload;
      const highlight = state.highlights.find(h => h.uuid === highlightUuid);
      if (highlight && highlight.reactions) {
        highlight.reactions = highlight.reactions.filter(r => r.userId !== userId);
      }
    },
    addReply: (state, action) => {
      const { highlightUuid, reply } = action.payload;
      const highlight = state.highlights.find(h => h.uuid === highlightUuid);
      if (highlight) {
        if (!highlight.replies) highlight.replies = [];
        highlight.replies.push(reply);
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setHighlights,
  addHighlight,
  updateHighlight,
  removeHighlight,
  setSelectedHighlight,
  addReaction,
  removeReaction,
  addReply,
  setLoading,
  setError,
  clearError,
} = highlightsSlice.actions;

export default highlightsSlice.reducer;