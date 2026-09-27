import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import LayoutWithAddons from './components/LayoutWithAddons/LayoutWithAddons';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/AdminRoute/AdminRoute';
import SecurityPinLock from './components/SecurityPinLock/SecurityPinLock';
import Auth from './pages/Auth/Auth';
import Dashboard from './pages/Dashboard/Dashboard';
import Landing from './pages/Landing/Landing';
import PostQuestion from './pages/PostQuestion/PostQuestion';
import QuestionDetailWithAddons from './pages/QuestionDetail/QuestionDetailWithAddons';
import MyQuestions from './pages/MyQuestions/MyQuestions';
import RagDocuments from './pages/RagDocuments/RagDocuments';
import Profile from './pages/Profile/Profile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import SetupAdmin from './pages/SetupAdmin/SetupAdmin';
import Plans from './pages/Plans/Plans';

export default function AppWithAddons() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          {/* Global PIN lock overlay for Security Plus premium feature */}
          <SecurityPinLock />
          <Routes>
            {/* Public routes */}
            <Route path='/' element={<Landing />} />
            <Route path='/auth' element={<Auth />} />
            {/* Pricing / Plans page — accessible without login */}
            {/* One-time admin setup — public but gated by secret */}
            <Route path='/setup-admin' element={<SetupAdmin />} />

            {/* Protected routes with Layout shell */}
            <Route element={<LayoutWithAddons />}>
              <Route
                path='/dashboard'
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/questions/ask'
                element={
                  <ProtectedRoute>
                    <PostQuestion />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/my-questions'
                element={
                  <ProtectedRoute>
                    <MyQuestions />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/questions/:questionHash'
                element={
                  <ProtectedRoute>
                    <QuestionDetailWithAddons />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/question/:questionHash'
                element={
                  <ProtectedRoute>
                    <QuestionDetailWithAddons />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/rag-documents'
                element={
                  <ProtectedRoute>
                    <RagDocuments />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/profile'
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/profile/:userId'
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Plans & Pricing — visible to all, inside layout */}
              <Route path='/plans' element={<Plans />} />

              {/* Admin Protected Route */}
              <Route
                path='/admin'
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
            </Route>

            {/* Catch-all redirect */}
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
