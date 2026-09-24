import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { api, getErrorMessage } from '../lib/api'
import type { NewsCategoryDto, NoticiaDto } from '../lib/types'
import { noticiaSchema, type NoticiaValues } from '../lib/validations'
import { RichTextEditor, isEmptyHtml } from '../components/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function NoticiaForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const coverRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<HTMLInputElement>(null)

  const [isPublished, setIsPublished] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [editorReady, setEditorReady] = useState(!isEdit)
  const [newMedia, setNewMedia] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoticiaValues>({
    resolver: zodResolver(noticiaSchema),
    defaultValues: { title: '', summary: '' },
  })

  const existing = useQuery({
    queryKey: ['news', id],
    enabled: isEdit,
    queryFn: async () => {
      const res = await api.get<NoticiaDto>(`/news/${id}`)
      return res.data
    },
  })

  const categoriesQuery = useQuery({
    queryKey: ['news-categories'],
    queryFn: async () => {
      const res = await api.get<NewsCategoryDto[]>('/news-categories')
      return res.data
    },
  })

  useEffect(() => {
    if (existing.data) {
      reset({
        title: existing.data.title,
        summary: existing.data.summary ?? '',
      })
      setIsPublished(existing.data.isPublished)
      setCategoryId(existing.data.category?.id ?? '')
      setBodyHtml(existing.data.body)
      setEditorReady(true)
    }
  }, [existing.data, reset])

  const createMutation = useMutation({
    mutationFn: async (form: FormData) => {
      await api.post('/news', form)
    },
    onSuccess: () => navigate('/noticias'),
    onError: (err) => setError(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: {
      title: string
      summary?: string
      body: string
      categoryId: string
      isPublished: boolean
    }) => {
      await api.patch(`/news/${id}`, data)
    },
    onSuccess: () => navigate(`/noticias/${id}`),
    onError: (err) => setError(getErrorMessage(err)),
  })

  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      await api.delete(`/news/${id}/media/${mediaId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news', id] }),
    onError: (err) => setError(getErrorMessage(err)),
  })

  async function uploadNewMedia() {
    if (!id || newMedia.length === 0) return
    const form = new FormData()
    newMedia.forEach((f) => form.append('media', f))
    try {
      await api.post(`/news/${id}/media`, form)
      setNewMedia([])
      if (mediaRef.current) mediaRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['news', id] })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  function onSubmit(values: NoticiaValues) {
    setError(null)
    if (isEmptyHtml(bodyHtml)) {
      setError('El contenido es obligatorio')
      return
    }

    if (isEdit) {
      updateMutation.mutate({
        title: values.title,
        summary: values.summary,
        body: bodyHtml,
        categoryId,
        isPublished,
      })
      return
    }

    const form = new FormData()
    form.append('title', values.title)
    form.append('summary', values.summary ?? '')
    form.append('body', bodyHtml)
    form.append('categoryId', categoryId)
    form.append('isPublished', String(isPublished))
    const cover = coverRef.current?.files?.[0]
    if (cover) form.append('cover', cover)
    newMedia.forEach((f) => form.append('media', f))
    createMutation.mutate(form)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        type="button"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Editar noticia' : 'Nueva noticia'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="summary">Resumen</Label>
              <Textarea id="summary" rows={2} {...register('summary')} />
            </div>

            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesQuery.data?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Contenido</Label>
              <RichTextEditor
                key={editorReady ? 'ready' : 'loading'}
                initialValue={bodyHtml}
                onChange={setBodyHtml}
              />
            </div>

            {!isEdit && (
              <div className="space-y-1.5">
                <Label>Imagen de portada (opcional)</Label>
                <Input
                  ref={coverRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Videos y audios adjuntos</Label>
              <Input
                ref={mediaRef}
                type="file"
                multiple
                accept="video/*,audio/*"
                onChange={(e) => setNewMedia(Array.from(e.target.files ?? []))}
              />
              {newMedia.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {newMedia.length} archivo(s) por subir
                </p>
              )}
              {isEdit && newMedia.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={uploadNewMedia}
                >
                  Subir adjuntos
                </Button>
              )}
            </div>

            {isEdit && existing.data?.media && existing.data.media.length > 0 && (
              <div className="space-y-1.5">
                <Label>Adjuntos actuales</Label>
                <ul className="space-y-1">
                  {existing.data.media.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between rounded border px-3 py-1.5 text-sm"
                    >
                      <span className="truncate">{m.originalName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar adjunto"
                        onClick={() => deleteMediaMutation.mutate(m.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isPublished}
                onCheckedChange={(v) => setIsPublished(Boolean(v))}
              />
              Publicar
            </label>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="size-4" />
              {isEdit ? 'Guardar cambios' : 'Publicar noticia'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
