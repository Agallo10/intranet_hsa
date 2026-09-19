import { NavLink, Outlet } from 'react-router-dom'
import {
  Newspaper,
  FileText,
  GraduationCap,
  Users,
  Tags,
  History,
  LogOut,
} from 'lucide-react'
import { cn } from 'cn'
import { useAuth } from '../features/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground',
  )

export function Layout() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r bg-background">
        <div className="flex h-16 items-center gap-2.5 border-b px-4">
          <img
            src="/logo_hs.png"
            alt="Hospital"
            className="h-9 w-auto object-contain"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold">Intranet</p>
            <p className="text-xs text-muted-foreground">Hospitalaria</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <NavLink to="/noticias" className={navLinkClass}>
            <Newspaper className="size-4" />
            Noticias
          </NavLink>
          <NavLink to="/formatos" className={navLinkClass}>
            <FileText className="size-4" />
            Formatos de documentos
          </NavLink>
          <NavLink to="/tutoriales" className={navLinkClass}>
            <GraduationCap className="size-4" />
            Tutoriales
          </NavLink>

          {isAdmin && (
            <>
              <Separator className="my-3" />
              <p className="px-3 text-xs font-medium uppercase text-muted-foreground">
                Administración
              </p>
              <NavLink to="/admin/usuarios" className={navLinkClass}>
                <Users className="size-4" />
                Usuarios
              </NavLink>
              <NavLink to="/admin/categorias" className={navLinkClass}>
                <Tags className="size-4" />
                Categorías
              </NavLink>
              <NavLink to="/admin/auditoria" className={navLinkClass}>
                <History className="size-4" />
                Registro de accesos
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{user?.fullName}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {user?.role}
              </p>
            </div>
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
        <div className="mx-auto max-w-5xl px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
