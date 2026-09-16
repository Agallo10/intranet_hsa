import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { api, getErrorMessage } from '../lib/api'
import type { CursoDto } from '../lib/types'
import { cursoSchema, type CursoValues } from '../lib/validations'
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

export function CursoForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [isPublished, setIsPublished] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CursoValues>({
    resolver: zodResolver(cursoSchema),
    defaultValues: { title: '', description: '' },
  })

  const existing = useQuery({
    queryKey: ['course', id],
    enabled: isEdit,
    queryFn: async () => {
      const res = await api.get<CursoDto>(`/courses/${id}`)
      return res.data
    },
  })

  useEffect(() => {
    if (existing.data) {
      reset({
        title: existing.data.title,
        description: existing.data.description ?? '',
      })
      setIsPublished(existing.data.isPublished)
    }
  }, [existing.data, reset])

  const createMutation = useMutation({
    mutationFn: async (data: CursoValues & { isPublished: boolean }) => {
      await api.post('/courses', data)
    },
    onSuccess: () => navigate('/tutoriales'),
    onError: (err) => setError(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: CursoValues & { isPublished: boolean }) => {
      await api.patch(`/courses/${id}`, data)
    },
    onSuccess: () => navigate(`/tutoriales/${id}`),
    onError: (err) => setError(getErrorMessage(err)),
  })

  function onSubmit(values: CursoValues) {
    setError(null)
    const payload = { ...values, isPublished }
    if (isEdit) updateMutation.mutate(payload)
    else createMutation.mutate(payload)
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
          <CardTitle>{isEdit ? 'Editar curso' : 'Nuevo curso'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título del curso</Label>
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
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" rows={4} {...register('description')} />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isPublished}
                onCheckedChange={(v) => setIsPublished(Boolean(v))}
              />
              Publicar curso
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
              {isEdit ? 'Guardar cambios' : 'Crear curso'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
