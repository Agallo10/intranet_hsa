import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Newspaper, Plus, Search } from 'lucide-react'
import { api } from '../lib/api'
import { authedUrl } from '../lib/token'
import { useAuth } from '../features/auth/AuthContext'
import type { ListResponse, NoticiaDto } from '../lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function Noticias() {
  const { user } = useAuth()
  const canPublish = user?.role === 'admin' || user?.role === 'comunicador'

  const [q, setQ] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['news', { q: searchTerm, page }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 10 }
      if (searchTerm) params.q = searchTerm
      const res = await api.get<ListResponse<NoticiaDto>>('/news', { params })
      return res.data
    },
    placeholderData: keepPreviousData,
  })

  const totalPages = query.data
    ? Math.max(1, Math.ceil(query.data.total / query.data.limit))
    : 1

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Noticias</h1>
          <p className="text-sm text-muted-foreground">
            Comunicados y novedades del hospital
          </p>
        </div>
        {canPublish && (
          <Button asChild>
            <Link to="/noticias/nueva">
              <Plus className="size-4" />
              Publicar noticia
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-6 flex gap-2">
        <Input
          placeholder="Buscar noticias..."
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

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : query.data && query.data.items.length === 0 ? (
        <Card className="py-16 text-center text-muted-foreground">
          <Newspaper className="mx-auto size-10 opacity-40" />
          <p className="mt-2 font-medium">No hay noticias</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {query.data?.items.map((n) => (
            <Link key={n.id} to={`/noticias/${n.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex gap-4 p-4">
                  {n.hasCover ? (
                    <img
                      src={authedUrl(`/api/news/${n.id}/cover`)}
                      alt=""
                      className="h-20 w-28 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Newspaper className="size-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h2 className="line-clamp-1 font-semibold">{n.title}</h2>
                      {!n.isPublished && (
                        <Badge variant="outline">Borrador</Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {n.summary ?? n.body}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.author?.fullName ?? '—'} ·{' '}
                      {new Date(n.publishedAt ?? n.createdAt).toLocaleDateString(
                        'es-CO',
                        { day: 'numeric', month: 'long', year: 'numeric' },
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {query.data && query.data.total > query.data.limit && (
        <div className="mt-6 flex items-center justify-between">
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
      )}
    </div>
  )
}
