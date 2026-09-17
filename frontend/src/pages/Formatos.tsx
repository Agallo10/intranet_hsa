import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileText, Plus, Trash2, Upload } from 'lucide-react'
import { api, getErrorMessage } from '../lib/api'
import type { CategoryDto, ContentDto, ListResponse } from '../lib/types'
import { documentSchema, type DocumentValues } from '../lib/validations'
import { useAuth } from '../features/auth/AuthContext'
import { DataTable } from '../components/data-table/data-table'
import type { LegacyColumnDef } from '@tanstack/react-table/legacy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

export function Formatos() {
  const { user } = useAuth()
  const canPublish = user?.role === 'admin' || user?.role === 'editor'
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const documentsQuery = useQuery({
    queryKey: ['contents', 'documents'],
    queryFn: async () => {
      const res = await api.get<ListResponse<ContentDto>>('/contents', {
        params: { type: 'document', limit: 100 },
      })
      return res.data.items
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contents/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents', 'documents'] })
    },
  })

  async function download(content: ContentDto) {
    const res = await api.get(`/contents/${content.id}/file`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(res.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = content.originalName
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const columns: LegacyColumnDef<ContentDto>[] = [
    {
      accessorKey: 'title',
      header: 'Documento',
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium">
          <FileText className="size-4 text-muted-foreground" />
          {row.original.title}
        </span>
      ),
    },
    {
      accessorFn: (row) => row.category?.name ?? '',
      header: 'Categoría',
      cell: ({ row }) => row.original.category?.name ?? '—',
    },
    {
      accessorKey: 'sizeBytes',
      header: 'Tamaño',
      cell: ({ row }) => formatBytes(row.original.sizeBytes),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString('es-CO'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => download(row.original)}
          >
            <Download className="size-4" />
            Descargar
          </Button>
          {(user?.role === 'admin' ||
            row.original.uploadedBy?.id === user?.id) && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar documento"
              onClick={() => {
                if (confirm('¿Eliminar este documento?')) {
                  deleteMutation.mutate(row.original.id)
                }
              }}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Formatos de documentos</h1>
          <p className="text-sm text-muted-foreground">
            Documentos y formatos de calidad descargables
          </p>
        </div>
        {canPublish && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Subir documento
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={documentsQuery.data ?? []}
        searchPlaceholder="Buscar documento..."
        emptyMessage="No hay documentos"
      />

      {canPublish && (
        <DocumentUploadDialog
          open={open}
          onOpenChange={setOpen}
          onUploaded={() => {
            queryClient.invalidateQueries({ queryKey: ['contents', 'documents'] })
          }}
        />
      )}
    </div>
  )
}

function DocumentUploadDialog({
  open,
  onOpenChange,
  onUploaded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onUploaded: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: { title: '', description: '', categoryId: '' },
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<CategoryDto[]>('/categories')
      return res.data
    },
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

  function onSubmit(values: DocumentValues) {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Debe seleccionar un archivo')
      return
    }
    const form = new FormData()
    form.append('file', file)
    form.append('title', values.title)
    form.append('description', values.description ?? '')
    form.append('type', 'document')
    if (values.categoryId) form.append('categoryId', values.categoryId)
    form.append('isPublished', 'true')
    uploadMutation.mutate(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Título</Label>
            <Input id="doc-title" {...register('title')} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-desc">Descripción</Label>
            <Textarea id="doc-desc" rows={2} {...register('description')} />
          </div>
          <div className="space-y-1.5">
            <Label>Categoría (opcional)</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesQuery.data?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Archivo</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
            />
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
              <Upload className="size-4" />
              Subir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
