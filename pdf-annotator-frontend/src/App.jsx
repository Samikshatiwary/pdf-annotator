import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import { setOnlineStatus } from './store/slices/offlineSlice';
import { initTheme } from './utils/theme';
import './styles/global.css';

// Apply the saved theme as early as possible to avoid a flash.
initTheme();

const AppRoutes = lazy(() => import('./routes/AppRoutes'));
// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const Loading = () =>(
  <div style = {{
    minHeight:'100vh',
    display:'flex',
    alignItems:'center',
    justifyContent:'center'
  }}>
    <div> Loading... </div>
  </div>
);

function App() {
  useEffect(() => {
    // Online/Offline status listener
    const handleOnline = () => store.dispatch(setOnlineStatus(true));
    const handleOffline = () => store.dispatch(setOnlineStatus(false));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Suspense fallback = {<Loading/>}>
          <AppRoutes/>
          </Suspense>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;