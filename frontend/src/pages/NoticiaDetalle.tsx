import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Newspaper, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { authedUrl } from '../lib/token'
import { useAuth } from '../features/auth/AuthContext'
import type { NoticiaDto } from '../lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export function NoticiaDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const query = useQuery({
    queryKey: ['news', id],
    queryFn: async () => {
      const res = await api.get<NoticiaDto>(`/news/${id}`)
      return res.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/news/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] })
      navigate('/noticias')
    },
  })

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-4xl">❌</p>
        <p className="mt-2 font-medium">Noticia no encontrada</p>
        <Link to="/noticias" className="mt-2 inline-block text-primary hover:underline">
          Volver a noticias
        </Link>
      </div>
    )
  }

  const n = query.data
  const canEdit = user?.role === 'admin' || n.author?.id === user?.id

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/noticias">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/noticias/${n.id}/editar`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
            <ConfirmDialog
              title="Eliminar noticia"
              description="Esta acción no se puede deshacer. La noticia se eliminará permanentemente."
              confirmLabel="Eliminar"
              onConfirm={() => deleteMutation.mutate()}
              trigger={
                <Button variant="outline" size="sm">
                  <Trash2 className="size-4 text-destructive" />
                  Eliminar
                </Button>
              }
            />
          </div>
        )}
      </div>

      <Card>
        {n.hasCover && (
          <img
            src={authedUrl(`/api/news/${n.id}/cover`)}
            alt={n.title}
            className="max-h-72 w-full object-cover"
          />
        )}
        {!n.hasCover && (
          <div className="flex h-40 items-center justify-center bg-muted">
            <Newspaper className="size-12 text-muted-foreground/40" />
          </div>
        )}
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2">
            {!n.isPublished && <Badge variant="outline">Borrador</Badge>}
            <span className="text-sm text-muted-foreground">
              {n.author?.fullName ?? '—'} ·{' '}
              {new Date(n.publishedAt ?? n.createdAt).toLocaleDateString(
                'es-CO',
                { day: 'numeric', month: 'long', year: 'numeric' },
              )}
            </span>
          </div>
          <h1 className="text-2xl font-semibold">{n.title}</h1>
          {n.summary && (
            <p className="mt-2 font-medium text-muted-foreground">{n.summary}</p>
          )}
          <Separator className="my-4" />
          <div className="whitespace-pre-wrap text-foreground/90">{n.body}</div>
        </CardContent>
      </Card>
    </div>
  )
}
