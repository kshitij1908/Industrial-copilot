import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { DocumentsPage } from './pages/DocumentsPage'
import ChatPage from './pages/ChatPage'
import EquipmentPage from './pages/EquipmentPage'
import KnowledgeGraphPage from './pages/KnowledgeGraphPage'
import SettingsPage from './pages/SettingsPage'
import { useAuthStore } from './stores/authStore'

export default function App() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected app routes */}
      <Route
        element={
          isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/equipment/:tag" element={<EquipmentPage />} />
        <Route path="/graph" element={<KnowledgeGraphPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
