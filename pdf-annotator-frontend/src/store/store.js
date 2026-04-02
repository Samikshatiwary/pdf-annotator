import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import pdfReducer from './slices/pdfSlice';
import highlightsReducer from './slices/highlightsSlice';
import userReducer from './slices/userSlice';
import dashboardReducer from './slices/dashboardSlice';
import searchReducer from './slices/searchSlice';
import sharingReducer from './slices/sharingSlice';
import activityReducer from './slices/activitySlice';
import uiReducer from './slices/uiSlice';
import offlineReducer from './slices/offlineSlice';
import collaborationReducer from './slices/collaborationsSlice';
import { offlineMiddleware } from './middleware/offlineMiddleware';
import { syncMiddleware } from './middleware/syncMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pdf: pdfReducer,
    highlights: highlightsReducer,
    user: userReducer,
    dashboard: dashboardReducer,
    search: searchReducer,
    sharing: sharingReducer,
    activity: activityReducer,
    ui: uiReducer,
    offline: offlineReducer,
    collaboration: collaborationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(offlineMiddleware, syncMiddleware),
});

export default store;