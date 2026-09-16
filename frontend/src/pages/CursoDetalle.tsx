import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  Play,
  Plus,
  Trash2,
  Video,
} from 'lucide-react'
import { api, getErrorMessage } from '../lib/api'
import { authedUrl } from '../lib/token'
import { useAuth } from '../features/auth/AuthContext'
import type { ContentDto, CursoDetalleDto } from '../lib/types'
import { videoSchema, type VideoValues } from '../lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function CursoDetalle() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'editor'
  const queryClient = useQueryClient()

  const [playing, setPlaying] = useState<ContentDto | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const query = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const res = await api.get<CursoDetalleDto>(`/courses/${id}`)
      return res.data
    },
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['course', id] })

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await api.delete(`/contents/${videoId}`)
    },
    onSuccess: () => invalidate(),
  })

  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/courses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
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
        <p className="mt-2 font-medium">Curso no encontrado</p>
        <Link to="/tutoriales" className="mt-2 inline-block text-primary hover:underline">
          Volver a tutoriales
        </Link>
      </div>
    )
  }

  const curso = query.data

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tutoriales">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/tutoriales/${curso.id}/editar`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Agregar video
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{curso.title}</h1>
          {!curso.isPublished && <Badge variant="outline">Borrador</Badge>}
        </div>
        {curso.description && (
          <p className="text-muted-foreground">{curso.description}</p>
        )}
      </div>

      {playing && (
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <video
              controls
              autoPlay
              className="max-h-[420px] w-full bg-black"
              src={authedUrl(`/api/contents/${playing.id}/file`)}
            />
            <div className="p-4">
              <p className="font-medium">{playing.title}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {curso.videos.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Video className="mx-auto size-10 opacity-40" />
              <p className="mt-2">Este curso aún no tiene videos</p>
            </div>
          ) : (
            <ul className="divide-y">
              {curso.videos.map((video, index) => (
                <li key={video.id} className="flex items-center gap-3 p-4">
                  <span className="w-8 text-center text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{video.title}</p>
                    {!video.isPublished && (
                      <p className="text-xs text-muted-foreground">Borrador</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlaying(video)}
                  >
                    <Play className="size-4" />
                    Reproducir
                  </Button>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar video"
                      onClick={() => {
                        if (confirm('¿Eliminar este video?')) {
                          deleteVideoMutation.mutate(video.id)
                        }
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <div className="mt-6">
          <Separator className="mb-4" />
          <Button
            variant="destructive"
            onClick={() => {
              if (
                confirm(
                  '¿Eliminar este curso? Esta acción es permanente.',
                )
              ) {
                deleteCourseMutation.mutate()
              }
            }}
          >
            <Trash2 className="size-4" />
            Eliminar curso
          </Button>
        </div>
      )}

      {canManage && (
        <AddVideoDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          cursoId={curso.id}
          position={curso.videos.length}
          onUploaded={invalidate}
        />
      )}
    </div>
  )
}

function AddVideoDialog({
  open,
  onOpenChange,
  cursoId,
  position,
  onUploaded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  cursoId: string
  position: number
  onUploaded: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VideoValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: { title: '' },
  })

  const uploadMutation = useMutation({
    mutationFn: async (form: FormData) => {
      await api.post('/contents', form)
    },
    onSuccess: () => {
      setError(null)
      reset()
      if (fileRef.current) fileRef.current.value = ''
      onOpenChange(false)
      onUploaded()
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  function onSubmit(values: VideoValues) {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Debe seleccionar un video')
      return
    }
    const form = new FormData()
    form.append('file', file)
    form.append('title', values.title)
    form.append('type', 'video')
    form.append('cursoId', cursoId)
    form.append('position', String(position))
    form.append('isPublished', 'true')
    uploadMutation.mutate(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar video al curso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="video-title">Título del video</Label>
            <Input id="video-title" {...register('title')} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Archivo de video</Label>
            <Input ref={fileRef} type="file" accept="video/mp4,video/webm" />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending}>
              <Plus className="size-4" />
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
