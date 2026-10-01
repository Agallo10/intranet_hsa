import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Tags, Pencil } from 'lucide-react'
import { api, getErrorMessage } from '../../lib/api'
import type { CategoryDto } from '../../lib/types'
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

export function Categories() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<CategoryDto | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editError, setEditError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<CategoryDto[]>('/categories', {
        params: { includeInactive: 'true' },
      })
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CategoryValues) => {
      await api.post('/categories', data)
    },
    onSuccess: () => {
      setError('')
      reset()
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: async (vars: { id: string; data: Partial<CategoryDto> }) => {
      await api.patch(`/categories/${vars.id}`, vars.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  const saveEditMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return
      await api.patch(`/categories/${editing.id}`, {
        name: editName,
        description: editDescription,
      })
    },
    onSuccess: () => {
      setEditing(null)
      setEditError('')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err) => setEditError(getErrorMessage(err)),
  })

  function startEdit(cat: CategoryDto) {
    setEditing(cat)
    setEditName(cat.name)
    setEditDescription(cat.description ?? '')
    setEditError('')
  }

  function onSubmit(values: CategoryValues) {
    createMutation.mutate(values)
  }

  const columns: LegacyColumnDef<CategoryDto, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }) => row.original.description ?? '—',
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
        <h1 className="text-2xl font-semibold">Categorías</h1>
        <p className="text-sm text-muted-foreground">
          Organización del contenido publicado
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Crear categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" {...register('description')} />
              </div>
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
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Descripción</Label>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
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
