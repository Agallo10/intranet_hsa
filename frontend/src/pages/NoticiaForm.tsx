import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { api, getErrorMessage } from '../lib/api'
import type { NoticiaDto } from '../lib/types'
import { noticiaSchema, type NoticiaValues } from '../lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
  const isEdit = Boolean(id)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoticiaValues>({
    resolver: zodResolver(noticiaSchema),
    defaultValues: { title: '', summary: '', body: '' },
  })

  const existing = useQuery({
    queryKey: ['news', id],
    enabled: isEdit,
    queryFn: async () => {
      const res = await api.get<NoticiaDto>(`/news/${id}`)
      return res.data
    },
  })

  useEffect(() => {
    if (existing.data) {
      reset({
        title: existing.data.title,
        summary: existing.data.summary ?? '',
        body: existing.data.body,
      })
      setIsPublished(existing.data.isPublished)
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
      isPublished: boolean
    }) => {
      await api.patch(`/news/${id}`, data)
    },
    onSuccess: () => navigate(`/noticias/${id}`),
    onError: (err) => setError(getErrorMessage(err)),
  })

  function onSubmit(values: NoticiaValues) {
    setError(null)
    if (isEdit) {
      updateMutation.mutate({ ...values, isPublished })
      return
    }
    const form = new FormData()
    form.append('title', values.title)
    form.append('summary', values.summary ?? '')
    form.append('body', values.body)
    form.append('isPublished', String(isPublished))
    const cover = fileRef.current?.files?.[0]
    if (cover) form.append('cover', cover)
    createMutation.mutate(form)
  }

  return (
    <div className="mx-auto max-w-2xl">
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
              <Label htmlFor="body">Contenido</Label>
              <Textarea
                id="body"
                rows={8}
                aria-invalid={!!errors.body}
                {...register('body')}
              />
              {errors.body && (
                <p className="text-xs text-destructive">{errors.body.message}</p>
              )}
            </div>

            {!isEdit && (
              <div className="space-y-1.5">
                <Label>Imagen de portada (opcional)</Label>
                <Input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                />
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
