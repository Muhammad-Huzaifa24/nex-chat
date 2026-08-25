import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { MainLayout } from './components/layout/MainLayout'
import { ToastContainer } from './components/ui/Toast'
import { Loader2 } from 'lucide-react'

// Protected route guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        <Loader2 size={36} className="animate-spin" color="var(--primary-color)" />
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Public route guard
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        <Loader2 size={36} className="animate-spin" color="var(--primary-color)" />
      </div>
    )
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children
}

export default function App() {
  const { fetchMe } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    // Apply saved theme to HTML element
    document.documentElement.setAttribute('data-theme', theme)
    fetchMe()
  }, [])

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
