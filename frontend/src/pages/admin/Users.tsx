import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { api, getErrorMessage } from '../../lib/api'
import type { Role, UserDto } from '../../lib/types'
import { userSchema, type UserValues } from '../../lib/validations'
import { DataTable } from '../../components/data-table/data-table'
import type { LegacyColumnDef } from '@tanstack/react-table/legacy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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

export function Users() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: '', fullName: '', password: '', role: 'lector' },
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<UserDto[]>('/users')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: UserValues) => {
      await api.post('/users', data)
    },
    onSuccess: () => {
      setSuccess('Usuario creado correctamente')
      setError('')
      reset()
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => {
      setSuccess('')
      setError(getErrorMessage(err))
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (vars: {
      id: string
      data: Partial<UserDto> & { password?: string }
    }) => {
      await api.patch(`/users/${vars.id}`, vars.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  function onSubmit(values: UserValues) {
    createMutation.mutate(values)
  }

  const columns: LegacyColumnDef<UserDto, unknown>[] = [
    {
      accessorKey: 'username',
      header: 'Usuario',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.username}</span>
      ),
    },
    {
      accessorKey: 'fullName',
      header: 'Nombre',
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => {
        const user = row.original
        return (
          <Select
            value={user.role}
            onValueChange={(v) =>
              updateMutation.mutate({ id: user.id, data: { role: v as Role } })
            }
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lector">Lector</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="comunicador">Comunicador</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        )
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="secondary">Activo</Badge>
        ) : (
          <Badge variant="destructive">Inactivo</Badge>
        ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const user = row.original
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateMutation.mutate({
                id: user.id,
                data: { isActive: !user.isActive },
              })
            }
          >
            {user.isActive ? 'Desactivar' : 'Activar'}
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de cuentas y roles del personal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Crear usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  aria-invalid={!!errors.username}
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-xs text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  aria-invalid={!!errors.fullName}
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lector">Lector</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="comunicador">Comunicador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={createMutation.isPending}>
              <UserPlus className="size-4" />
              Crear usuario
            </Button>
          </form>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={usersQuery.data ?? []}
        searchPlaceholder="Buscar usuario..."
        emptyMessage="No hay usuarios"
      />
    </div>
  )
}
