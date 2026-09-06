import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { DirectChatRedirect } from './pages/DirectChatRedirect'
import { SettingsPage } from './pages/SettingsPage'
import { MainLayout } from './components/layout/MainLayout'
import { ToastContainer } from './components/ui/Toast'
import { AppLoader } from './components/ui/AppLoader'

// Protected route — requires authentication AND email verification
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) return <AppLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user && !user.isVerified) return <Navigate to="/verify-email" replace />

  return children
}

// Public route — redirects authenticated + verified users to /
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) return <AppLoader />
  if (isAuthenticated && user?.isVerified) return <Navigate to="/" replace />

  return children
}

// Verify-email route — only accessible when pendingEmail is set
const VerifyRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user, pendingEmail } = useAuthStore()

  if (isLoading) return <AppLoader />
  // Already verified — go to app
  if (isAuthenticated && user?.isVerified) return <Navigate to="/" replace />
  // No pending registration — go to register
  if (!pendingEmail && !isAuthenticated) return <Navigate to="/register" replace />

  return children
}

export default function App() {
  const { fetchMe, isLoading } = useAuthStore()
  const { theme } = useThemeStore()
  const [splashFinished, setSplashFinished] = useState(false)

  const handleSplashComplete = React.useCallback(() => {
    setSplashFinished(true)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    fetchMe()
  }, [])

  // Show splash loader screen for 3s or until bar animation completes
  if (!splashFinished || isLoading) {
    return <AppLoader onComplete={handleSplashComplete} />
  }

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <VerifyRoute>
              <VerifyEmailPage />
            </VerifyRoute>
          }
        />
        <Route path="/u/:username" element={<DirectChatRedirect />} />
        <Route path="/chat/:username" element={<DirectChatRedirect />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
