import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Newspaper,
  FileText,
  GraduationCap,
  Users,
  Tags,
  History,
  MessageSquare,
  Building2,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from 'cn'
import { useAuth } from '../features/auth/AuthContext'
import { useSocket } from '../features/chat/SocketContext'
import { useTheme } from '../features/theme/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const COLLAPSE_KEY = 'intranet_sidebar_collapsed'

export function Layout() {
  const { user, logout } = useAuth()
  const { totalUnread } = useSocket()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === 'true',
  )

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed))
  }, [collapsed])

  useEffect(() => {
    if (
      location.pathname.startsWith('/admin/categorias') ||
      location.pathname.startsWith('/admin/areas')
    ) {
      setCategoriesOpen(true)
    }
  }, [location.pathname])

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center rounded-md text-sm font-medium transition-colors',
      collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground',
    )

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          'sticky top-0 flex h-screen shrink-0 flex-col border-r bg-background transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b',
            collapsed ? 'justify-center px-2' : 'justify-between gap-2.5 px-4',
          )}
        >
          {collapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              aria-label="Expandir menú"
              title="Expandir menú"
            >
              <PanelLeftOpen className="size-4" />
            </Button>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-2.5">
                <img
                  src="/logo_hs.png"
                  alt="Hospital"
                  className="h-9 w-auto shrink-0 object-contain"
                />
                <div className="leading-tight">
                  <p className="text-sm font-semibold">Intranet</p>
                  <p className="text-xs text-muted-foreground">Hospitalaria</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(true)}
                aria-label="Encoger menú"
                title="Encoger menú"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </>
          )}
        </div>

        <nav className={cn('flex-1 space-y-1 overflow-y-auto', collapsed ? 'p-2' : 'p-3')}>
          <NavLink to="/noticias" className={navClass} title={collapsed ? 'Noticias' : undefined}>
            <Newspaper className="size-4 shrink-0" />
            {!collapsed && <span>Noticias</span>}
          </NavLink>
          <NavLink to="/documentos" className={navClass} title={collapsed ? 'Documentos' : undefined}>
            <FileText className="size-4 shrink-0" />
            {!collapsed && <span>Documentos</span>}
          </NavLink>
          <NavLink to="/tutoriales" className={navClass} title={collapsed ? 'Tutoriales' : undefined}>
            <GraduationCap className="size-4 shrink-0" />
            {!collapsed && <span>Tutoriales</span>}
          </NavLink>
          <NavLink to="/chat" className={navClass} title={collapsed ? 'Chat' : undefined}>
            <span className="relative shrink-0">
              <MessageSquare className="size-4" />
              {collapsed && totalUnread > 0 && (
                <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                  {totalUnread}
                </span>
              )}
            </span>
            {!collapsed && <span>Chat</span>}
            {!collapsed && totalUnread > 0 && (
              <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {totalUnread}
              </span>
            )}
          </NavLink>

          {isAdmin && (
            <>
              <Separator className="my-3" />
              {!collapsed && (
                <p className="px-3 text-xs font-medium uppercase text-muted-foreground">
                  Administración
                </p>
              )}
              <NavLink
                to="/admin/usuarios"
                className={navClass}
                title={collapsed ? 'Usuarios' : undefined}
              >
                <Users className="size-4 shrink-0" />
                {!collapsed && <span>Usuarios</span>}
              </NavLink>

              <button
                type="button"
                title={collapsed ? 'Categorías' : undefined}
                onClick={() => {
                  if (collapsed) {
                    setCollapsed(false)
                    setCategoriesOpen(true)
                  } else {
                    setCategoriesOpen((o) => !o)
                  }
                }}
                className={cn(
                  'flex w-full items-center rounded-md text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-accent-foreground',
                  collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2',
                  categoriesOpen && !collapsed && 'text-foreground',
                )}
              >
                <Tags className="size-4 shrink-0" />
                {!collapsed && <span>Categorías</span>}
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'ml-auto size-4 transition-transform',
                      categoriesOpen && 'rotate-180',
                    )}
                  />
                )}
              </button>

              {!collapsed && categoriesOpen && (
                <div className="ml-4 space-y-1">
                  <NavLink to="/admin/categorias" end className={navClass}>
                    <FileText className="size-4 shrink-0" />
                    Documentos
                  </NavLink>
                  <NavLink to="/admin/categorias-noticias" end className={navClass}>
                    <Newspaper className="size-4 shrink-0" />
                    Noticias
                  </NavLink>
                  <NavLink to="/admin/areas" end className={navClass}>
                    <Building2 className="size-4 shrink-0" />
                    Áreas
                  </NavLink>
                </div>
              )}

              <NavLink
                to="/admin/auditoria"
                className={navClass}
                title={collapsed ? 'Registro de accesos' : undefined}
              >
                <History className="size-4 shrink-0" />
                {!collapsed && <span>Registro de accesos</span>}
              </NavLink>
            </>
          )}
        </nav>

        <div className={cn('border-t', collapsed ? 'p-2' : 'p-3')}>
          <div
            className={cn(
              'flex items-center',
              collapsed ? 'flex-col gap-2' : 'gap-3',
            )}
          >
            {!collapsed && (
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{user?.fullName}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {user?.role}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-muted/40">
        <div className="mx-auto max-w-[1600px] px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
