export const syncMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Auto-sync when coming online
  if (action.type === 'offline/setOnlineStatus' && action.payload === true) {
    console.log('Back online - syncing data...');
    // Trigger sync
  }
  
  return result;
};