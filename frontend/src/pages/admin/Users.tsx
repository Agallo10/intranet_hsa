import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Pencil, Trash2, UserPlus } from 'lucide-react'
import { api, getErrorMessage } from '../../lib/api'
import type { Role, UserDto } from '../../lib/types'
import { userSchema, type UserValues } from '../../lib/validations'
import { DataTable } from '../../components/data-table/data-table'
import type { LegacyColumnDef } from '@tanstack/react-table/legacy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function Users() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pwUser, setPwUser] = useState<UserDto | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [editing, setEditing] = useState<UserDto | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editFullName, setEditFullName] = useState('')
  const [editRole, setEditRole] = useState<Role>('lector')
  const [editError, setEditError] = useState('')
  const [showInactive, setShowInactive] = useState(false)

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

  const changePasswordMutation = useMutation({
    mutationFn: async (vars: { id: string; password: string }) => {
      await api.patch(`/users/${vars.id}`, { password: vars.password })
    },
    onSuccess: () => {
      setPwUser(null)
      setNewPassword('')
      setPwError('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => setPwError(getErrorMessage(err)),
  })

  const editMutation = useMutation({
    mutationFn: async (vars: {
      id: string
      username: string
      fullName: string
      role: Role
    }) => {
      await api.patch(`/users/${vars.id}`, {
        username: vars.username,
        fullName: vars.fullName,
        role: vars.role,
      })
    },
    onSuccess: () => {
      setEditing(null)
      setEditError('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => setEditError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`)
    },
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  function submitPasswordChange() {
    if (!pwUser) return
    if (newPassword.length < 6) {
      setPwError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    changePasswordMutation.mutate({ id: pwUser.id, password: newPassword })
  }

  function startEdit(user: UserDto) {
    setEditing(user)
    setEditUsername(user.username)
    setEditFullName(user.fullName)
    setEditRole(user.role)
    setEditError('')
  }

  function saveEdit() {
    if (!editing) return
    editMutation.mutate({
      id: editing.id,
      username: editUsername,
      fullName: editFullName,
      role: editRole,
    })
  }

  function removeUser(user: UserDto) {
    if (
      confirm(
        `¿Eliminar permanentemente a "${user.fullName}"? Si tiene contenido asociado no se podrá eliminar; use "Desactivar" en su lugar.`,
      )
    ) {
      deleteMutation.mutate(user.id)
    }
  }

  function onSubmit(values: UserValues) {
    createMutation.mutate(values)
  }

  const visibleUsers = (usersQuery.data ?? []).filter(
    (u) => showInactive || u.isActive,
  )

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
              <SelectItem value="gestor_documental">Gestor documental</SelectItem>
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
      accessorKey: 'mustChangePassword',
      header: 'Contraseña',
      cell: ({ row }) =>
        row.original.mustChangePassword ? (
          <Badge variant="outline" className="text-amber-600">
            Debe cambiar contraseña
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startEdit(user)}
            >
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPwUser(user)
                setNewPassword('')
                setPwError('')
              }}
            >
              <KeyRound className="size-4" />
              Contraseña
            </Button>
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
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar usuario"
              onClick={() => removeUser(user)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
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
                        <SelectItem value="gestor_documental">Gestor documental</SelectItem>
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={showInactive}
            onCheckedChange={(v) => setShowInactive(Boolean(v))}
          />
          Mostrar usuarios inactivos
        </label>
      </div>

      <DataTable
        columns={columns}
        data={visibleUsers}
        searchPlaceholder="Buscar usuario..."
        emptyMessage="No hay usuarios"
      />

      <Dialog open={!!pwUser} onOpenChange={(open) => !open && setPwUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Usuario: <span className="font-medium">{pwUser?.fullName}</span>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nueva contraseña temporal</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {pwError && (
              <Alert variant="destructive">
                <AlertDescription>{pwError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwUser(null)}>
              Cancelar
            </Button>
            <Button
              onClick={submitPasswordChange}
              disabled={changePasswordMutation.isPending}
            >
              Cambiar contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-username">Usuario</Label>
              <Input
                id="edit-username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-fullname">Nombre completo</Label>
              <Input
                id="edit-fullname"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as Role)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lector">Lector</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="comunicador">Comunicador</SelectItem>
                  <SelectItem value="gestor_documental">
                    Gestor documental
                  </SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
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
            <Button onClick={saveEdit} disabled={editMutation.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
