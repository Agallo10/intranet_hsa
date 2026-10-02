import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Eye, FileText, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { api, getErrorMessage } from '../lib/api'
import { authedUrl } from '../lib/token'
import type { CategoryDto, ContentDto, ListResponse } from '../lib/types'
import { documentSchema, type DocumentValues } from '../lib/validations'
import { useAuth } from '../features/auth/AuthContext'
import { DataTable } from '../components/data-table/data-table'
import { ConfirmDialog } from '../components/ConfirmDialog'
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

const isPdf = (mime: string | null) => mime === 'application/pdf'

export function Documentos() {
  const { user } = useAuth()
  const canPublish =
    user?.role === 'admin' ||
    user?.role === 'editor' ||
    user?.role === 'gestor_documental'
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ContentDto | null>(null)
  const [previewing, setPreviewing] = useState<ContentDto | null>(null)

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
    a.download = content.originalName ?? 'documento'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const canEditDoc = (content: ContentDto) =>
    user?.role === 'admin' || content.uploadedBy?.id === user?.id

  const columns: LegacyColumnDef<ContentDto>[] = [
    {
      accessorKey: 'title',
      header: 'Documento',
      cell: ({ row }) => (
        <button
          className="flex items-center gap-2 font-medium hover:underline"
          onClick={() => setPreviewing(row.original)}
        >
          <FileText className="size-4 text-muted-foreground" />
          {row.original.title}
        </button>
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
      cell: ({ row }) => formatBytes(row.original.sizeBytes ?? 0),
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
      cell: ({ row }) => {
        const content = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ver documento"
              onClick={() => setPreviewing(content)}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => download(content)}
            >
              <Download className="size-4" />
              Descargar
            </Button>
            {canEditDoc(content) && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar documento"
                onClick={() => setEditing(content)}
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {canEditDoc(content) && (
              <ConfirmDialog
                title="Eliminar documento"
                description="El documento y su archivo se eliminarán permanentemente."
                confirmLabel="Eliminar"
                onConfirm={() => deleteMutation.mutate(content.id)}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar documento"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                }
              />
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Documentos, protocolos y formatos de calidad descargables
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

      <EditDocumentDialog
        content={editing}
        onClose={() => setEditing(null)}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ['contents', 'documents'] })
        }
      />

      <PreviewDocumentDialog
        content={previewing}
        onClose={() => setPreviewing(null)}
        onDownload={download}
      />
    </div>
  )
}

function EditDocumentDialog({
  content,
  onClose,
  onSaved,
}: {
  content: ContentDto | null
  onClose: () => void
  onSaved: () => void
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
  })
  const [error, setError] = useState<string | null>(null)

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<CategoryDto[]>('/categories')
      return res.data
    },
  })

  const editMutation = useMutation({
    mutationFn: async (data: DocumentValues) => {
      await api.patch(`/contents/${content!.id}`, data)
    },
    onSuccess: () => {
      onClose()
      onSaved()
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  // Prefill when content changes
  useEffect(() => {
    if (content) {
      reset({
        title: content.title,
        description: content.description ?? '',
        categoryId: content.category?.id ?? '',
      })
    }
  }, [content, reset])

  function onSubmit(values: DocumentValues) {
    editMutation.mutate(values)
  }

  return (
    <Dialog open={!!content} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Nombre</Label>
            <Input id="edit-title" {...register('title')} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Descripción</Label>
            <Textarea id="edit-desc" rows={2} {...register('description')} />
          </div>
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin área" />
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

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editMutation.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PreviewDocumentDialog({
  content,
  onClose,
  onDownload,
}: {
  content: ContentDto | null
  onClose: () => void
  onDownload: (content: ContentDto) => void
}) {
  const pdf = content && isPdf(content.mimeType)

  return (
    <Dialog open={!!content} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[96vw]">
        <DialogHeader>
          <DialogTitle>{content?.title}</DialogTitle>
        </DialogHeader>
        {content && (
          <div className="space-y-3">
            {pdf ? (
              <iframe
                src={authedUrl(`/api/contents/${content.id}/file?preview=1`)}
                title={content.title}
                className="h-[85vh] w-full rounded-md border"
              />
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto size-10 opacity-40" />
                <p className="mt-2">
                  No hay vista previa para este tipo de archivo.
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => onDownload(content)}
                >
                  <Download className="size-4" />
                  Descargar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
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
                <Select value={field.value} onValueChange={field.onChange}>
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
