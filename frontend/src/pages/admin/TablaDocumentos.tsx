import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, Save, TableProperties } from 'lucide-react'
import { api, getErrorMessage } from '../../lib/api'
import type {
  DocumentTableColumn,
  DocumentTableConfigDto,
} from '../../lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ALL_COLUMNS: DocumentTableColumn[] = [
  'title',
  'code',
  'type',
  'version',
  'area',
  'category',
  'date',
]

const COLUMN_INFO: Record<
  DocumentTableColumn,
  { label: string; description: string }
> = {
  title: { label: 'Documento', description: 'Nombre del documento y acceso a la vista previa' },
  code: { label: 'Código', description: 'Código del formato o documento' },
  type: { label: 'Tipo', description: 'PDF, Word, Excel, PowerPoint, entre otros' },
  version: { label: 'Versión', description: 'Versión registrada del documento' },
  area: { label: 'Área', description: 'Área responsable del documento' },
  category: { label: 'Categoría', description: 'Categoría del documento' },
  date: { label: 'Fecha', description: 'Fecha de actualización o de elaboración' },
}

export function TablaDocumentos() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<DocumentTableColumn[] | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const configQuery = useQuery({
    queryKey: ['settings', 'document-table'],
    queryFn: async () => {
      const res = await api.get<DocumentTableConfigDto>('/settings/document-table')
      return res.data
    },
  })

  const selected = draft ?? configQuery.data?.columns ?? ALL_COLUMNS

  const saveMutation = useMutation({
    mutationFn: async (columns: DocumentTableColumn[]) => {
      await api.put('/settings/document-table', { columns })
    },
    onSuccess: () => {
      setError('')
      setSaved(true)
      setDraft(null)
      queryClient.invalidateQueries({ queryKey: ['settings', 'document-table'] })
    },
    onError: (err) => {
      setSaved(false)
      setError(getErrorMessage(err))
    },
  })

  function toggle(column: DocumentTableColumn, checked: boolean) {
    setSaved(false)
    setDraft(
      checked
        ? [...selected, column]
        : selected.filter((item) => item !== column),
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Tabla de documentos</h1>
        <p className="text-sm text-muted-foreground">
          Elegí qué columnas se muestran en la tabla de Documentos. La
          configuración se aplica a todos los usuarios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableProperties className="size-4" />
            Columnas visibles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {configQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {ALL_COLUMNS.map((column) => {
                const checked = selected.includes(column)
                const isLastChecked = checked && selected.length === 1
                return (
                  <div
                    key={column}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <Checkbox
                      id={`column-${column}`}
                      checked={checked}
                      disabled={isLastChecked || saveMutation.isPending}
                      onCheckedChange={(value) => toggle(column, value === true)}
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor={`column-${column}`}>
                        {COLUMN_INFO[column].label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {COLUMN_INFO[column].description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            La columna de acciones siempre se muestra. Debe quedar al menos una
            columna seleccionada.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {saved && !error && (
            <Alert>
              <AlertDescription>Configuración guardada.</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => saveMutation.mutate(selected)}
              disabled={saveMutation.isPending || configQuery.isLoading}
            >
              <Save className="size-4" />
              Guardar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSaved(false)
                setDraft([...ALL_COLUMNS])
              }}
              disabled={saveMutation.isPending}
            >
              <RotateCcw className="size-4" />
              Restaurar todas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
