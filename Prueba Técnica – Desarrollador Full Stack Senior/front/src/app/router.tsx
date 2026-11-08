import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { lazy, Suspense, useSyncExternalStore } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import WorkspaceLayout from '@/app/WorkspaceLayout'
import AuthLayout from '@/features/auth/layouts/AuthLayout'
import CreatePage from '@/features/auth/pages/CreatePage'
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import DashboardPage from '@/features/workspaces/pages/DashboardPage'
import CreateWorkspacePage from '@/features/workspaces/pages/CreateWorkspacePage'
import HomeDocumentPage from '@/features/documents/pages/HomeDocumentPage'
import { useSessionActivity } from '@/features/auth/hooks/useSessionActivity'
import { getSessionId, subscribeToSession } from '@/features/auth/session/sessionToken'

const DocumentPage = lazy(() => import('@/features/documents/pages/DocumentPage'))
const DocumentHistoryPage = lazy(() => import('@/features/versions/pages/DocumentHistoryPage'))

function ProtectedWorkspace() {
  const sessionId = useSyncExternalStore(subscribeToSession, getSessionId)
  return sessionId ? <WorkspaceLayout /> : <Navigate to="/login" replace />
}

function GuestLogin() {
  const sessionId = useSyncExternalStore(subscribeToSession, getSessionId)
  return sessionId ? <Navigate to="/dashboard" replace /> : <LoginPage />
}

function AuthRoutes() {
  useSessionActivity()
  const location = useLocation()
  const reducedMotion = useReducedMotion()

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={location.pathname === '/register' ? 'register' : 'auth'}
        className="overflow-clip"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' } }}
        exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.12, ease: 'easeIn' } }}
      >
        <Routes location={location}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<GuestLogin />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/register" element={<CreatePage />} />
          <Route element={<ProtectedWorkspace />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/document" element={<HomeDocumentPage />} />
            <Route path="/document/:documentId" element={
              <Suspense fallback={<p role="status">Abriendo documento…</p>}><DocumentPage /></Suspense>
            } />
            <Route path="/document/:documentId/history" element={
              <Suspense fallback={<p role="status">Cargando historial…</p>}><DocumentHistoryPage /></Suspense>
            } />
            <Route path="/workspaces/new" element={<CreateWorkspacePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthRoutes />
    </BrowserRouter>
  )
}

export default AppRouter
