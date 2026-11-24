import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { api, getErrorMessage } from '../lib/api'
import { documentSchema, type DocumentValues } from '../lib/validations'
import type {
  AreaDto,
  CategoryDto,
  ContentHeaderExtraction,
} from '../lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

const ACCEPTED = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf'

type ItemStatus = 'pending' | 'saved' | 'error'

interface QueueItem {
  id: string
  file: File
  status: ItemStatus
  error: string | null
  extracting: boolean
  extracted: boolean
  headerMessage: string | null
  previewUrl: string | null
  values: DocumentValues
}

let itemSequence = 0
const nextItemId = () => `bulk-${++itemSequence}`

const emptyValues = (areaId: string): DocumentValues => ({
  title: '',
  description: '',
  code: '',
  version: '',
  elaborationDate: '',
  updateDate: '',
  categoryId: '',
  areaId,
})

const STATUS_LABEL: Record<ItemStatus, string> = {
  pending: 'Pendiente',
  saved: 'Guardado',
  error: 'Con error',
}

const isPdfFile = (file: File) =>
  file.type === 'application/pdf' || /\.pdf$/i.test(file.name)

export function BulkUploadDialog({
  open,
  onOpenChange,
  onUploaded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: () => void
}) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const objectUrls = useRef<string[]>([])
  const [items, setItems] = useState<QueueItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bulkAreaId, setBulkAreaId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<CategoryDto[]>('/categories')
      return res.data
    },
  })

  const areasQuery = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const res = await api.get<AreaDto[]>('/areas')
      return res.data
    },
  })

  useEffect(() => {
    return () => {
      for (const url of objectUrls.current) {
        URL.revokeObjectURL(url)
      }
      objectUrls.current = []
    }
  }, [])

  const selected = items.find((item) => item.id === selectedId) ?? null
  const savedCount = items.filter((item) => item.status === 'saved').length
  const pendingCount = items.length - savedCount
  const allSaved = items.length > 0 && savedCount === items.length

  const previewUrl =
    selected && isPdfFile(selected.file) ? selected.previewUrl : null

  function updateItem(
    id: string,
    changes:
      | Partial<QueueItem>
      | ((item: QueueItem) => Partial<QueueItem>),
  ) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...(typeof changes === 'function' ? changes(item) : changes),
            }
          : item,
      ),
    )
  }

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)

    const known = new Set(
      items.map((item) => `${item.file.name}:${item.file.size}`),
    )
    const added: QueueItem[] = []
    for (const file of Array.from(files)) {
      const key = `${file.name}:${file.size}`
      if (known.has(key)) continue
      known.add(key)
      const previewUrl = URL.createObjectURL(file)
      objectUrls.current.push(previewUrl)
      added.push({
        id: nextItemId(),
        file,
        status: 'pending',
        error: null,
        extracting: false,
        extracted: false,
        headerMessage: null,
        previewUrl,
        values: emptyValues(bulkAreaId),
      })
    }

    if (added.length === 0) {
      setError('Esos archivos ya están en la cola')
      return
    }

    setItems((prev) => [...prev, ...added])
    if (!selectedId) {
      setSelectedId(added[0].id)
      void extractHeader(added[0])
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function selectItem(item: QueueItem) {
    setSelectedId(item.id)
    setError(null)
    if (item.status !== 'pending' || item.extracted) return
    await extractHeader(item)
  }

  async function extractHeader(item: QueueItem) {
    updateItem(item.id, {
      extracting: true,
      extracted: true,
      headerMessage: null,
    })
    try {
      const form = new FormData()
      form.append('file', item.file)
      const res = await api.post<ContentHeaderExtraction>(
        '/contents/extract-metadata',
        form,
      )
      const data = res.data

      updateItem(item.id, (current) => {
        if (!data.supported) {
          return { extracting: false, headerMessage: data.message }
        }
        return {
          extracting: false,
          headerMessage: data.message,
          values: {
            ...current.values,
            title: current.values.title || data.title || '',
            code: current.values.code || data.code || '',
            version: current.values.version || data.version || '',
            elaborationDate:
              current.values.elaborationDate || data.elaborationDate || '',
            updateDate: current.values.updateDate || data.updateDate || '',
          },
        }
      })
    } catch (err) {
      updateItem(item.id, {
        extracting: false,
        headerMessage: getErrorMessage(err),
      })
    }
  }

  function applyBulkArea(areaId: string) {
    setBulkAreaId(areaId)
    setItems((prev) =>
      prev.map((item) =>
        item.status === 'saved'
          ? item
          : { ...item, values: { ...item.values, areaId } },
      ),
    )
  }

  function changeValue(field: keyof DocumentValues, value: string) {
    if (!selected) return
    updateItem(selected.id, {
      values: { ...selected.values, [field]: value },
      error: null,
    })
    setError(null)
  }

  function removeItem(id: string) {
    const target = items.find((item) => item.id === id)
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl)
      objectUrls.current = objectUrls.current.filter(
        (url) => url !== target.previewUrl,
      )
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
    if (selectedId === id) {
      const remaining = items.filter((item) => item.id !== id)
      setSelectedId(remaining[0]?.id ?? null)
    }
  }

  async function saveCurrent(advance = true) {
    if (!selected) return
    const parsed = documentSchema.safeParse(selected.values)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revise los datos')
      return
    }

    setSaving(true)
    setError(null)
    updateItem(selected.id, { status: 'pending', error: null })

    try {
      const values = parsed.data
      const form = new FormData()
      form.append('file', selected.file)
      form.append('title', values.title)
      form.append('description', values.description ?? '')
      form.append('code', values.code ?? '')
      form.append('version', values.version ?? '')
      form.append('elaborationDate', values.elaborationDate ?? '')
      form.append('updateDate', values.updateDate ?? '')
      form.append('type', 'document')
      if (values.categoryId) form.append('categoryId', values.categoryId)
      if (values.areaId) form.append('areaId', values.areaId)
      form.append('isPublished', 'true')

      await api.post('/contents', form)
      updateItem(selected.id, {
        status: 'saved',
        error: null,
        values: { ...selected.values, ...values },
      })
      queryClient.invalidateQueries({ queryKey: ['contents', 'documents'] })
      onUploaded()

      if (advance) {
        const nextItem = items.find(
          (item) => item.id !== selected.id && item.status !== 'saved',
        )
        if (nextItem) {
          setSelectedId(nextItem.id)
          if (!nextItem.extracted) {
            void extractHeader(nextItem)
          }
        }
      }
    } catch (err) {
      const message = getErrorMessage(err)
      updateItem(selected.id, { status: 'error', error: message })
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  function resetQueue() {
    setItems([])
    setSelectedId(null)
    setBulkAreaId('')
    setError(null)
    for (const url of objectUrls.current) {
      URL.revokeObjectURL(url)
    }
    objectUrls.current = []
    if (fileRef.current) fileRef.current.value = ''
  }

  const formDisabled = saving || selected?.status === 'saved'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null)
        onOpenChange(next)
      }}
    >
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden sm:max-w-[95vw] lg:max-w-[1280px]">
        <DialogHeader>
          <DialogTitle>Carga masiva de documentos</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="bulk-files">Agregar documentos</Label>
              <Input
                id="bulk-files"
                ref={fileRef}
                type="file"
                multiple
                accept={ACCEPTED}
                onChange={(event) => addFiles(event.target.files)}
                className="max-w-[320px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Área para todos</Label>
              <Select value={bulkAreaId} onValueChange={applyBulkArea}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Sin área" />
                </SelectTrigger>
                <SelectContent>
                  {areasQuery.data?.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Plus className="size-4" />
              Elegir archivos
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto mb-2 size-8 opacity-40" />
              Seleccioná uno o varios documentos para empezar. Se agregan en el
              orden en que los elegís.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="max-h-[62vh] space-y-2 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => void selectItem(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        void selectItem(item)
                      }
                    }}
                    className={`w-full cursor-pointer rounded-md border p-2 text-left transition-colors ${
                      item.id === selectedId ? 'border-primary bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-xs text-muted-foreground">
                        {index + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-medium"
                          title={item.values.title || item.file.name}
                        >
                          {item.values.title || item.file.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge
                            variant={
                              item.status === 'saved'
                                ? 'default'
                                : item.status === 'error'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {STATUS_LABEL[item.status]}
                          </Badge>
                          {item.extracting && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Loader2 className="size-3 animate-spin" />
                              Leyendo
                            </span>
                          )}
                        </div>
                      </div>
                      {item.status !== 'saved' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Quitar de la cola"
                          disabled={saving}
                          onClick={(event) => {
                            event.stopPropagation()
                            removeItem(item.id)
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    {item.error && (
                      <p className="mt-1 line-clamp-2 text-xs text-destructive">
                        {item.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="min-w-0 space-y-3 xl:max-h-[62vh] xl:overflow-y-auto xl:pr-1">
                {selected ? (
                  <>
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <p
                        className="min-w-0 flex-1 truncate text-sm font-medium"
                        title={selected.file.name}
                      >
                        {selected.file.name}
                      </p>
                      {selected.status === 'saved' && (
                        <Badge variant="default">
                          <CheckCircle2 className="size-3" />
                          Guardado
                        </Badge>
                      )}
                    </div>

                    {selected.extracting && (
                      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Leyendo el encabezado del documento...
                      </div>
                    )}

                    {!selected.extracting && selected.headerMessage && (
                      <p className="text-xs text-muted-foreground">
                        {selected.headerMessage}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="bulk-title">Nombre</Label>
                      <Input
                        id="bulk-title"
                        value={selected.values.title}
                        onChange={(event) =>
                          changeValue('title', event.target.value)
                        }
                        disabled={formDisabled}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bulk-desc">Descripción (opcional)</Label>
                      <Textarea
                        id="bulk-desc"
                        rows={2}
                        value={selected.values.description}
                        onChange={(event) =>
                          changeValue('description', event.target.value)
                        }
                        disabled={formDisabled}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="min-w-0 space-y-1.5">
                        <Label htmlFor="bulk-code">Código</Label>
                        <Input
                          id="bulk-code"
                          value={selected.values.code}
                          onChange={(event) =>
                            changeValue('code', event.target.value)
                          }
                          disabled={formDisabled}
                        />
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <Label htmlFor="bulk-version">Versión</Label>
                        <Input
                          id="bulk-version"
                          value={selected.values.version}
                          onChange={(event) =>
                            changeValue('version', event.target.value)
                          }
                          disabled={formDisabled}
                        />
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <Label htmlFor="bulk-elab">Fecha de elaboración</Label>
                        <Input
                          id="bulk-elab"
                          type="date"
                          value={selected.values.elaborationDate}
                          onChange={(event) =>
                            changeValue('elaborationDate', event.target.value)
                          }
                          disabled={formDisabled}
                        />
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <Label htmlFor="bulk-upd">Fecha de actualización</Label>
                        <Input
                          id="bulk-upd"
                          type="date"
                          value={selected.values.updateDate}
                          onChange={(event) =>
                            changeValue('updateDate', event.target.value)
                          }
                          disabled={formDisabled}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="min-w-0 space-y-1.5">
                        <Label>Categoría</Label>
                        <Select
                          value={selected.values.categoryId}
                          onValueChange={(value) =>
                            changeValue('categoryId', value)
                          }
                          disabled={formDisabled}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sin categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoriesQuery.data?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <Label>Área</Label>
                        <Select
                          value={selected.values.areaId}
                          onValueChange={(value) => changeValue('areaId', value)}
                          disabled={formDisabled}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sin área" />
                          </SelectTrigger>
                          <SelectContent>
                            {areasQuery.data?.map((area) => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                    Seleccioná un documento de la cola para completar sus datos.
                  </div>
                )}
              </div>

              <div className="min-w-0 xl:max-h-[62vh]">
                {selected ? (
                  previewUrl ? (
                    <iframe
                      src={previewUrl}
                      title={`Vista previa de ${selected.file.name}`}
                      className="h-[62vh] w-full rounded-md border"
                    />
                  ) : (
                    <div className="flex h-[62vh] flex-col items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
                      <Eye className="mb-2 size-8 opacity-40" />
                      <p>La vista previa solo está disponible para PDF.</p>
                      <p className="mt-1 text-xs">{selected.file.name}</p>
                    </div>
                  )
                ) : (
                  <div className="flex h-[62vh] items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
                    Sin documento seleccionado
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {items.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span>
                {savedCount} guardados · {pendingCount} pendientes de{' '}
                {items.length}
              </span>
              {allSaved && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <CheckCircle2 className="size-3.5" />
                  Todos los documentos se guardaron
                </span>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={resetQueue}
            disabled={saving}
          >
            Limpiar cola
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={() => void saveCurrent()}
            disabled={
              !selected ||
              saving ||
              selected.status === 'saved' ||
              selected.extracting
            }
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Guardar y siguiente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
