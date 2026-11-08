import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { lazy, Suspense, useSyncExternalStore } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useOutletContext, useSearchParams } from 'react-router'
import WorkspaceLayout, { type WorkspaceOutletContext } from '@/app/WorkspaceLayout'
import AuditPage from '@/features/audit/pages/AuditPage'
import AuthLayout from '@/features/auth/layouts/AuthLayout'
import CreatePage from '@/features/auth/pages/CreatePage'
import LoginPage from '@/features/auth/pages/LoginPage'
import AcceptInvitationPage from '@/features/invitations/pages/AcceptInvitationPage'
import ReceivedInvitationsPage from '@/features/invitations/pages/ReceivedInvitationsPage'
import { getInvitationReturnPath } from '@/features/invitations/utils/invitationLink'
import DashboardPage from '@/features/workspaces/pages/DashboardPage'
import CreateWorkspacePage from '@/features/workspaces/pages/CreateWorkspacePage'
import WorkspacesPage from '@/features/workspaces/pages/WorkspacesPage'
import WorkspaceMembersPage from '@/features/workspaces/pages/WorkspaceMembersPage'
import WorkspaceDocumentsPage from '@/features/documents/pages/WorkspaceDocumentsPage'
import { useSessionActivity } from '@/features/auth/hooks/useSessionActivity'
import { getSessionId, subscribeToSession } from '@/features/auth/session/sessionToken'

const DocumentPage = lazy(() => import('@/features/documents/pages/DocumentPage'))
const DocumentHistoryPage = lazy(() => import('@/features/versions/pages/DocumentHistoryPage'))

function ProtectedWorkspace() {
  const sessionId = useSyncExternalStore(subscribeToSession, getSessionId)
  return sessionId ? <WorkspaceLayout /> : <Navigate to="/login" replace />
}

function ManagerAudit() {
  const { workspaceCapabilities: { canCreateWorkspace, isLoading, error } } = useOutletContext<WorkspaceOutletContext>()
  if (error) return <p role="alert" className="rounded-xl bg-danger-bg p-4 text-sm text-danger-text">{error}</p>
  if (isLoading) return <p role="status" className="text-sm text-secondary-700">Comprobando permisos…</p>
  return canCreateWorkspace ? <AuditPage /> : <Navigate to="/dashboard" replace />
}

function GuestLogin() {
  const sessionId = useSyncExternalStore(subscribeToSession, getSessionId)
  const { state } = useLocation()
  const destination = getInvitationReturnPath(state) ?? '/dashboard'
  return sessionId ? <Navigate to={destination} replace /> : <LoginPage destination={destination} />
}

function LegacyDocumentList() {
  const [params] = useSearchParams()
  const workspaceId = Number(params.get('space'))
  const path = Number.isSafeInteger(workspaceId) && workspaceId > 0 ? `/workspaces/${workspaceId}` : '/workspaces'
  return <Navigate to={path} replace />
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
          </Route>
          <Route path="/register" element={<CreatePage />} />
          <Route path="/invitations/accept" element={<AcceptInvitationPage />} />
          <Route element={<ProtectedWorkspace />}>
            <Route path="/invitations" element={<ReceivedInvitationsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/audit" element={<ManagerAudit />} />
            <Route path="/workspaces" element={<WorkspacesPage />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspaceDocumentsPage />} />
            <Route path="/workspaces/:workspaceId/members" element={<WorkspaceMembersPage />} />
            <Route path="/document" element={<LegacyDocumentList />} />
            <Route path="/document/:documentId" element={
              <Suspense fallback={<p role="status">Abriendo documento…</p>}><DocumentPage /></Suspense>
            } />
            <Route path="/document/:documentId/view" element={
              <Suspense fallback={<p role="status">Abriendo documento…</p>}><DocumentPage readOnly /></Suspense>
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
