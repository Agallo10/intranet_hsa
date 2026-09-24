import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Newspaper, Trash2 } from 'lucide-react'
import DOMPurify from 'dompurify'
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
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {!n.isPublished && <Badge variant="outline">Borrador</Badge>}
            {n.category && <Badge variant="secondary">{n.category.name}</Badge>}
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
          <div
            className="text-foreground/90 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(n.body) }}
          />

          {n.media && n.media.length > 0 && (
            <div className="mt-4 space-y-3">
              {n.media.map((m) => {
                const url = authedUrl(`/api/news/${n.id}/media/${m.id}/file`)
                return m.type === 'video' ? (
                  <video
                    key={m.id}
                    controls
                    className="max-h-80 w-full rounded-md bg-black"
                    src={url}
                  />
                ) : (
                  <div key={m.id} className="rounded-md border p-3">
                    <p className="mb-2 text-sm text-muted-foreground">
                      {m.originalName}
                    </p>
                    <audio controls className="w-full" src={url} />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
