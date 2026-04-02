import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Lazy load all pages
const DropboxCallback = lazy(() => import('../pages/auth/DropboxCallback'));
const GoogleCallback = lazy(() => import('../pages/auth/GoogleCallback'));
const Layout = lazy(() => import('../components/user/layout/Layout'));
const Login = lazy(() => import('../pages/auth/Login'));
const Signup = lazy(() => import('../pages/auth/Signup'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Library = lazy(() => import('../pages/Library'));
const PDFViewer = lazy(() => import('../pages/PDFViewer'));
const SharedLibrary = lazy(() => import('../pages/SharedLibrary'));
const PublicLibrary = lazy(() => import('../pages/PublicLibrary'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const Activity = lazy(() => import('../pages/Activity'));
const Analytics = lazy(() => import('../pages/Analytics'));
const NotFound = lazy(() => import('../pages/NotFound'));

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/callback" element={<DropboxCallback />} />


      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="library" element={<Library />} />
        <Route path="pdf/:uuid" element={<PDFViewer />} />
        <Route path="shared" element={<SharedLibrary />} />
        <Route path="public" element={<PublicLibrary />} />
        <Route path="favorites" element={<Library />} />
        <Route path="archived" element={<Library />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="activity" element={<Activity />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;