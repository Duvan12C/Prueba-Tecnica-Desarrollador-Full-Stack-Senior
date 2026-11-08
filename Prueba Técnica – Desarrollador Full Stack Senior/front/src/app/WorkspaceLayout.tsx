import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { motion, useReducedMotion } from 'motion/react'
import { NavLink, Outlet } from 'react-router'
import logo from '@/assets/docspace-imagotipo-horizontal-oscuro.svg'
import mark from '@/assets/docspace-isotipo-oscuro.svg'
import { signOut } from '@/features/auth/session/sessionLifecycle'
import Button from '@/shared/components/Button'

function Sidebar({
  collapsed = false,
  onToggle,
  onNavigate,
  onLogout,
}: {
  collapsed?: boolean
  onToggle?: () => void
  onNavigate?: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-secondary-950 text-primary-100">
      <div className={`flex min-h-16 items-center border-b border-white/10 ${collapsed ? 'justify-center' : 'justify-between gap-2 px-4'}`}>
        {!collapsed && <img src={logo} alt="DocSpace" className="h-9 w-32 min-w-0 object-contain object-left" />}
        {onToggle && (
          <Button
            variant="custom"
            size="icon"
            aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            title={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            aria-expanded={!collapsed}
            onClick={onToggle}
            className="shrink-0 hover:bg-white/10"
          >
            {collapsed ? (
              <img src={mark} alt="" className="size-7 object-contain" />
            ) : (
              <Icon icon="solar:alt-arrow-left-linear" width="20" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>
      <nav aria-label="Navegación principal" className="flex-1 p-3">
        <NavLink
          to="/dashboard"
          end
          title={collapsed ? 'Inicio' : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center rounded-lg py-2.5 text-sm font-medium motion-safe:transition-colors ${collapsed ? 'justify-center' : 'gap-3 px-3'} ${isActive ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Icon icon="solar:home-2-linear" width="20" className="shrink-0" aria-hidden="true" />
          <span className={collapsed ? 'sr-only' : 'whitespace-nowrap'}>Inicio</span>
        </NavLink>
        <NavLink
          to="/document"
          title={collapsed ? 'Documentos' : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center rounded-lg py-2.5 text-sm font-medium motion-safe:transition-colors ${collapsed ? 'justify-center' : 'gap-3 px-3'} ${isActive ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Icon icon="solar:document-text-linear" width="20" className="shrink-0" aria-hidden="true" />
          <span className={collapsed ? 'sr-only' : 'whitespace-nowrap'}>Documentos</span>
        </NavLink>
      </nav>
      <div className="border-t border-white/10 p-3">
        <Button
          variant="custom"
          size={collapsed ? 'icon' : 'sm'}
          fullWidth
          onClick={onLogout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          tapScale={0.97}
          textColor="var(--ds-danger-bg)"
          className={`hover:bg-danger/20 ${collapsed ? '' : 'justify-start!'}`}
          startIcon={<Icon icon="solar:logout-2-linear" width="20" aria-hidden="true" />}
        >
          <span className={collapsed ? 'sr-only' : 'whitespace-nowrap'}>Cerrar sesión</span>
        </Button>
      </div>
    </div>
  )
}

export default function WorkspaceLayout() {
  const reducedMotion = useReducedMotion()
  const drawer = useRef<HTMLDialogElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 48rem)')
    const dialog = drawer.current
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches && dialog?.open) dialog.close()
    }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  return (
    <div className="min-h-dvh bg-neutral-50 md:flex">
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 224 }}
        transition={reducedMotion ? { duration: 0 } : { type: 'spring', bounce: sidebarCollapsed ? 0 : 0.3, duration: 0.45 }}
        className="sticky top-0 hidden h-dvh shrink-0 overflow-clip md:block"
      >
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)} onLogout={signOut} />
      </motion.aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-neutral-200 bg-white px-4 md:px-6">
          <Button
            variant="custom"
            size="icon"
            aria-label="Abrir menú"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="workspace-menu"
            onClick={() => {
              drawer.current?.showModal()
              setMenuOpen(true)
            }}
            textColor="var(--ds-secondary-950)"
            className="hover:bg-neutral-100 md:hidden"
          >
            <Icon icon="solar:hamburger-menu-linear" width="24" aria-hidden="true" />
          </Button>
          <span className="font-heading font-semibold text-secondary-950 md:hidden">DocSpace</span>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <dialog
        id="workspace-menu"
        ref={drawer}
        aria-label="Menú de DocSpace"
        onClick={(event) => {
          if (event.target === event.currentTarget) setMenuOpen(false)
        }}
        onCancel={(event) => {
          event.preventDefault()
          setMenuOpen(false)
        }}
        onClose={() => setMenuOpen(false)}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent backdrop:bg-secondary-950/50 md:hidden"
      >
        <motion.div
          initial={false}
          animate={menuOpen ? 'open' : 'closed'}
          variants={{
            open: { x: 0, opacity: 1 },
            closed: { x: reducedMotion ? 0 : '-100%', opacity: 0 },
          }}
          transition={{ duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
          onAnimationComplete={(state) => {
            if (state === 'closed' && drawer.current?.open) drawer.current.close()
          }}
          className="relative h-full w-64 max-w-[85vw]"
        >
          <Button
            variant="custom"
            size="icon"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            textColor="white"
            className="absolute top-3 right-3 z-10 hover:bg-white/10"
          >
            <Icon icon="solar:close-circle-linear" width="22" aria-hidden="true" />
          </Button>
          <Sidebar onNavigate={() => setMenuOpen(false)} onLogout={signOut} />
        </motion.div>
      </dialog>
    </div>
  )
}
