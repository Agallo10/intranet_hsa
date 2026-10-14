import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Tags, Pencil } from 'lucide-react'
import { api, getErrorMessage } from '../../lib/api'
import type { NewsCategoryDto } from '../../lib/types'
import { categorySchema, type CategoryValues } from '../../lib/validations'
import { DataTable } from '../../components/data-table/data-table'
import type { LegacyColumnDef } from '@tanstack/react-table/legacy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function CategoriasNoticias() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<NewsCategoryDto | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  })

  const categoriesQuery = useQuery({
    queryKey: ['news-categories', 'all'],
    queryFn: async () => {
      const res = await api.get<NewsCategoryDto[]>('/news-categories', {
        params: { includeInactive: 'true' },
      })
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.post('/news-categories', { name })
    },
    onSuccess: () => {
      setError('')
      reset()
      queryClient.invalidateQueries({ queryKey: ['news-categories'] })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: async (vars: { id: string; data: Partial<NewsCategoryDto> }) => {
      await api.patch(`/news-categories/${vars.id}`, vars.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-categories'] })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  const saveEditMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return
      await api.patch(`/news-categories/${editing.id}`, { name: editName })
    },
    onSuccess: () => {
      setEditing(null)
      setEditError('')
      queryClient.invalidateQueries({ queryKey: ['news-categories'] })
    },
    onError: (err) => setEditError(getErrorMessage(err)),
  })

  function startEdit(cat: NewsCategoryDto) {
    setEditing(cat)
    setEditName(cat.name)
    setEditError('')
  }

  function onSubmit(values: CategoryValues) {
    createMutation.mutate(values.name)
  }

  const columns: LegacyColumnDef<NewsCategoryDto>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="secondary">Activa</Badge>
        ) : (
          <Badge variant="destructive">Inactiva</Badge>
        ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const cat = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startEdit(cat)}
            >
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateMutation.mutate({
                  id: cat.id,
                  data: { isActive: !cat.isActive },
                })
              }
            >
              {cat.isActive ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Categorías de noticias</h1>
        <p className="text-sm text-muted-foreground">
          Clasificación de noticias (resoluciones, circulares, políticas)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Crear categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-w-sm space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={createMutation.isPending}>
              <Tags className="size-4" />
              Crear categoría
            </Button>
          </form>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={categoriesQuery.data ?? []}
        searchPlaceholder="Buscar categoría..."
        emptyMessage="No hay categorías"
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            {editError && (
              <Alert variant="destructive">
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveEditMutation.mutate()}
              disabled={saveEditMutation.isPending}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
