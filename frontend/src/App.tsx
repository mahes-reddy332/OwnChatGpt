import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { PublicRoute } from './auth/PublicRoute';
import { SessionExpiryModal } from './components/auth/SessionExpiryModal';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AppLayout } from './components/layout/AppLayout';
import { ProfilePage } from './pages/ProfilePage';
import { PersonalizationPage } from './pages/PersonalizationPage';
import { SettingsPage } from './pages/SettingsPage';
import { LanguagePage } from './pages/LanguagePage';
import { SkillsPage } from './pages/SkillsPage';
import { ConnectorsPage } from './pages/ConnectorsPage';
import { PluginsPage } from './pages/PluginsPage';
import { HelpPage } from './pages/HelpPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SessionExpiryModal />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
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

          {/* Protected Authenticated Workspace Routes */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:threadId"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personalization"
            element={
              <ProtectedRoute>
                <PersonalizationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/language"
            element={
              <ProtectedRoute>
                <LanguagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/language"
            element={
              <ProtectedRoute>
                <LanguagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <ProtectedRoute>
                <SkillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connectors"
            element={
              <ProtectedRoute>
                <ConnectorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plugins"
            element={
              <ProtectedRoute>
                <PluginsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
