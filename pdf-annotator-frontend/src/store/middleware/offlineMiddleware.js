export const offlineMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Handle offline actions
  if (!navigator.onLine) {
    console.log('Offline action queued:', action.type);
    // Queue actions for later sync
  }
  
  return result;
};