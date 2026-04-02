import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeUsers: [],
  collaborators: [],
  loading: false,
};

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    setActiveUsers: (state, action) => {
      state.activeUsers = action.payload;
    },
    setCollaborators: (state, action) => {
      state.collaborators = action.payload;
    },
    addCollaborator: (state, action) => {
      state.collaborators.push(action.payload);
    },
    removeCollaborator: (state, action) => {
      state.collaborators = state.collaborators.filter(c => c.id !== action.payload);
    },
  },
});

export const { setActiveUsers, setCollaborators, addCollaborator, removeCollaborator } = collaborationSlice.actions;
export default collaborationSlice.reducer;