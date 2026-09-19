import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { api } from '../../lib/api'
import type { AuditLogDto, ListResponse } from '../../lib/types'
import { DataTable } from '../../components/data-table/data-table'
import type { LegacyColumnDef } from '@tanstack/react-table/legacy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'auth.login_success': { label: 'Inicio de sesión', variant: 'secondary' },
  'auth.login_failure': { label: 'Intento fallido', variant: 'destructive' },
  'content.delete': { label: 'Documento/video eliminado', variant: 'outline' },
  'news.delete': { label: 'Noticia eliminada', variant: 'outline' },
  'course.delete': { label: 'Curso eliminado', variant: 'outline' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Auditoria() {
  const [q, setQ] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [action, setAction] = useState('all')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['audit-logs', { q: searchTerm, action, page }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 50 }
      if (searchTerm) params.q = searchTerm
      if (action !== 'all') params.action = action
      const res = await api.get<ListResponse<AuditLogDto>>('/audit-logs', {
        params,
      })
      return res.data
    },
    placeholderData: keepPreviousData,
  })

  const totalPages = query.data
    ? Math.max(1, Math.ceil(query.data.total / query.data.limit))
    : 1

  const columns: LegacyColumnDef<AuditLogDto>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: 'action',
      header: 'Acción',
      cell: ({ row }) => {
        const meta = ACTION_LABELS[row.original.action] ?? {
          label: row.original.action,
          variant: 'outline' as const,
        }
        return <Badge variant={meta.variant}>{meta.label}</Badge>
      },
    },
    {
      accessorKey: 'username',
      header: 'Usuario',
      cell: ({ row }) => row.original.username ?? '—',
    },
    {
      accessorKey: 'details',
      header: 'Detalle',
      cell: ({ row }) => row.original.details ?? '—',
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      cell: ({ row }) => row.original.ip ?? '—',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Registro de accesos</h1>
        <p className="text-sm text-muted-foreground">
          Bitácora de eventos de seguridad y acciones relevantes
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Buscar por usuario o detalle..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setPage(1), setSearchTerm(q))}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPage(1)
              setSearchTerm(q)
            }}
          >
            <Search className="size-4" />
          </Button>
        </div>

        <Select
          value={action}
          onValueChange={(v) => {
            setAction(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Todas las acciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            <SelectItem value="auth.login_success">Inicio de sesión</SelectItem>
            <SelectItem value="auth.login_failure">Intento fallido</SelectItem>
            <SelectItem value="content.delete">Documento/video eliminado</SelectItem>
            <SelectItem value="news.delete">Noticia eliminada</SelectItem>
            <SelectItem value="course.delete">Curso eliminado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.items ?? []}
        emptyMessage="No hay eventos registrados"
      />

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
