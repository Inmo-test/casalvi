'use client'

import { useRef, useState } from 'react'
import { Button } from "@/components/ui"
import { Upload } from 'lucide-react'
import Papa from 'papaparse'
import { importActivities } from '@/app/actions/activities'
import { useToast } from '@/hooks/use-toast'
import { platformRefresh } from '@/lib/utils/platform'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui"
import { Label } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"

type MappingStep = 'upload' | 'map' | 'importing'

type FieldMapping = {
  dbKey: string
  label: string
  required: boolean
  csvColumn: string
  description?: string
}

// Campos destino para Actividades
const TARGET_FIELDS: Omit<FieldMapping, 'csvColumn'>[] = [
  {
    dbKey: 'contact_identifier',
    label: 'Identificador del Contacto',
    required: true,
    description: 'Email, Teléfono o Nombre para vincular la actividad'
  },
  {
    dbKey: 'content',
    label: 'Contenido/Nota',
    required: false,
    description: 'Texto de la actividad (nota, descripción, comentario)'
  },
  {
    dbKey: 'channel',
    label: 'Canal/Tipo',
    required: false,
    description: 'Tipo de actividad (llamada, visita, nota, etc.)'
  },
  {
    dbKey: 'date',
    label: 'Fecha',
    required: false,
    description: 'Fecha de creación de la actividad'
  },
]

export function ActivityCsvImporter() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mappingStep, setMappingStep] = useState<MappingStep>('upload')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const { toast } = useToast()

  // Función para adivinar automáticamente el mapeo
  const guessMapping = (header: string, targetField: string): boolean => {
    const normalizedHeader = header.trim().toLowerCase()

    // Mapeo inteligente de coincidencias para actividades
    const matches: Record<string, string[]> = {
      contact_identifier: [
        'email', 'correo', 'correo electrónico', 'e-mail', 'mail',
        'cliente', 'contacto', 'email cliente',
        'phone', 'teléfono', 'telefono', 'móvil', 'movil', 'celular', 'tel',
        'nombre', 'nombre completo', 'first name', 'firstname', 'name',
      ],
      content: [
        'nota', 'notas', 'contenido', 'content',
        'descripción', 'descripcion', 'descripcion', 'desc',
        'mensaje', 'message', 'comentario', 'comentarios',
        'resumen', 'summary', 'texto', 'text',
        'detalles', 'observaciones', 'observación',
      ],
      channel: [
        'tipo', 'type', 'canal', 'channel',
        'medio', 'método', 'metodo',
        'categoría', 'categoria',
        'interacción', 'interaccion',
      ],
      date: [
        'fecha', 'date', 'fecha creación', 'fecha_creacion',
        'creado', 'created', 'created_at',
        'hora', 'time', 'timestamp',
        'fecha actividad', 'fecha_actividad',
      ],
    }

    const possibleMatches = matches[targetField] || []
    return possibleMatches.some(match =>
      normalizedHeader.includes(match) ||
      match.includes(normalizedHeader) ||
      normalizedHeader === match
    )
  }

  // Inicializar mapeos con auto-detección
  const initializeMappings = (headers: string[]): FieldMapping[] => {
    return TARGET_FIELDS.map(field => {
      // Buscar coincidencia automática
      const matchedHeader = headers.find(header => guessMapping(header, field.dbKey))

      return {
        ...field,
        csvColumn: matchedHeader || 'ignore',
      }
    })
  }

  // Función auxiliar para procesar los resultados del parseo
  const processResults = (results: Papa.ParseResult<Record<string, string>>, source: string = 'intento inicial') => {
    console.log(`PapaParse Results (${source}):`, results)

    if (results.errors.length > 0) {
      console.warn(`Errores al parsear CSV (${source}):`, results.errors)
    }

    const headers = results.meta.fields || []
    const rows = results.data as Record<string, string>[]

    // Verificar si tenemos headers válidos
    if (headers.length === 0) {
      console.error(`CSV sin cabeceras (${source}). Errores:`, results.errors)
      console.error('Meta información:', results.meta)
      return { success: false, needsRetry: true }
    }

    // Verificar si tenemos datos válidos
    if (rows.length === 0) {
      console.error(`CSV vacío o sin datos (${source}). Errores:`, results.errors)
      console.error('Meta información:', results.meta)
      console.error('Datos parseados:', results.data)

      // Si no hay errores o solo hay errores menores, puede ser un problema de formato
      const hasCriticalErrors = results.errors.some(
        err => err.type === 'Delimiter' || err.type === 'Quotes' || err.type === 'FieldMismatch'
      )

      return { success: false, needsRetry: !hasCriticalErrors }
    }

    // Éxito: tenemos headers y datos válidos
    const initialMappings = initializeMappings(headers)

    setCsvHeaders(headers)
    setCsvRows(rows)
    setFieldMappings(initialMappings)
    setMappingStep('map')

    return { success: true, needsRetry: false }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    // Validar extensión
    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Error',
        description: 'Por favor, selecciona un archivo CSV',
        variant: 'destructive',
      })
      return
    }

    try {
      // PRIMER INTENTO: Auto-detectar formato (UTF-8, delimitador automático)
      Papa.parse(file, {
        header: true,
        delimiter: "", // Auto-detectar delimitador (coma o punto y coma)
        skipEmptyLines: 'greedy', // Ignorar líneas vacías de forma agresiva
        // Sin encoding específico - dejar que el navegador intente adivinar
        complete: (results) => {
          // Intentar procesar con los resultados del primer intento
          const processed = processResults(results as any, 'Auto-detección')

          // Si falló y parece que necesita reintento (sin errores críticos)
          if (!processed.success && processed.needsRetry) {
            console.log('🔄 Primer intento falló. Intentando con configuración europea...')

            // SEGUNDO INTENTO: Configuración europea forzada (punto y coma + Latin1)
            Papa.parse(file, {
              header: true,
              delimiter: ";", // Forzar punto y coma
              encoding: "ISO-8859-1", // Forzar codificación Excel (Latin1)
              skipEmptyLines: 'greedy',
              complete: (retryResults) => {
                const retryProcessed = processResults(retryResults as any, 'Reintento (Europeo)')

                if (!retryProcessed.success) {
                  // Ambos intentos fallaron
                  toast({
                    title: 'Error',
                    description: 'No se pudo leer el archivo CSV. Verifica que el formato sea correcto. Revisa la consola para más detalles.',
                    variant: 'destructive',
                  })
                }
                // Si retryProcessed.success es true, ya se abrió el diálogo de mapeo
              },
              error: (error) => {
                console.error('Error al leer CSV (Reintento Europeo):', error)
                toast({
                  title: 'Error al leer archivo',
                  description: 'No se pudo leer el archivo CSV incluso con configuración europea. Verifica que el formato sea correcto.',
                  variant: 'destructive',
                })
              },
            })
          } else if (!processed.success) {
            // Falla definitiva (no necesita reintento)
            toast({
              title: 'Error',
              description: 'El archivo CSV no tiene cabeceras válidas o tiene errores críticos. Revisa la consola para más detalles.',
              variant: 'destructive',
            })
          }
          // Si processed.success es true, ya se abrió el diálogo de mapeo
        },
        error: (error) => {
          console.error('Error al leer CSV (Auto-detección):', error)

          // Si falla el primer intento, intentar con configuración europea
          console.log('🔄 Error en auto-detección. Intentando con configuración europea...')

          Papa.parse(file, {
            header: true,
            delimiter: ";", // Forzar punto y coma
            encoding: "ISO-8859-1", // Forzar codificación Excel (Latin1)
            skipEmptyLines: 'greedy',
            complete: (retryResults) => {
              const retryProcessed = processResults(retryResults as any, 'Reintento (Europeo)')

              if (!retryProcessed.success) {
                toast({
                  title: 'Error al leer archivo',
                  description: 'No se pudo leer el archivo CSV. Verifica que el formato sea correcto.',
                  variant: 'destructive',
                })
              }
            },
            error: (retryError) => {
              console.error('Error al leer CSV (Reintento Europeo):', retryError)
              toast({
                title: 'Error al leer archivo',
                description: 'No se pudo leer el archivo CSV. Verifica que el formato sea correcto.',
                variant: 'destructive',
              })
            },
          })
        },
      })
    } catch (error) {
      console.error('Error inesperado:', error)
      toast({
        title: 'Error inesperado',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    }
  }

  const handleMappingChange = (dbKey: string, csvColumn: string) => {
    setFieldMappings(prev =>
      prev.map(mapping =>
        mapping.dbKey === dbKey
          ? { ...mapping, csvColumn }
          : mapping
      )
    )
  }

  const handleConfirmImport = async () => {
    // Validar que el campo requerido (Identificador) esté mapeado
    const identifierMapping = fieldMappings.find(m => m.dbKey === 'contact_identifier')
    if (!identifierMapping || !identifierMapping.csvColumn || identifierMapping.csvColumn === 'ignore') {
      toast({
        title: 'Campo requerido',
        description: 'Debes mapear el campo "Identificador del Contacto" a una columna del CSV',
        variant: 'destructive',
      })
      return
    }

    setMappingStep('importing')

    // Mostrar toast de carga
    const loadingToast = toast({
      title: 'Importando actividades...',
      description: 'Procesando archivo CSV y vinculando con contactos...',
    })

    try {
      // Re-mapear las filas del CSV al formato esperado por importActivities
      const transformedActivities = csvRows.map(row => {
        const transformed: Record<string, any> = {}

        fieldMappings.forEach(mapping => {
          // Ignorar si el campo está configurado como "ignore" o está vacío
          if (!mapping.csvColumn || mapping.csvColumn === 'ignore') {
            return
          }

          if (row[mapping.csvColumn]) {
            const value = row[mapping.csvColumn].trim()

            if (value) {
              // Mapear el identificador del contacto según el tipo
              if (mapping.dbKey === 'contact_identifier') {
                // Intentar detectar si es email, teléfono o nombre
                const normalizedValue = value.toLowerCase()

                if (normalizedValue.includes('@')) {
                  // Es un email
                  transformed.email = value
                } else if (/[\d\s\+\-\(\)]/.test(value) && value.replace(/[\s\+\-\(\)]/g, '').length >= 9) {
                  // Parece un teléfono
                  transformed.phone = value
                } else {
                  // Asumir que es nombre (podría ser first_name o nombre completo)
                  // La Server Action buscará por nombre completo
                  const nameParts = value.split(' ')
                  if (nameParts.length >= 2) {
                    transformed.first_name = nameParts[0]
                    transformed.last_name = nameParts.slice(1).join(' ')
                  } else {
                    transformed.first_name = value
                  }
                }
              } else if (mapping.dbKey === 'content') {
                transformed.content = value
              } else if (mapping.dbKey === 'channel') {
                transformed.channel = value
              } else if (mapping.dbKey === 'date') {
                transformed.fecha = value
              }
            }
          }
        })

        return transformed
      })

      // Llamar a la Server Action
      const result = await importActivities(transformedActivities)

      // Cerrar toast de carga
      loadingToast.dismiss()

      if ('error' in result && result.error) {
        toast({
          title: 'Error al importar',
          description: result.error,
          variant: 'destructive',
        })
        setMappingStep('map')
      } else if ('success' in result && result.success && 'count' in result) {
        // Construir mensaje de éxito con estadísticas
        let successMessage = `✅ ${result.count} actividad${result.count !== 1 ? 'es' : ''} importada${result.count !== 1 ? 's' : ''}`

        if ('errors' in result && result.errors && result.errors > 0) {
          successMessage += ` (${result.errors} no encontrada${result.errors !== 1 ? 's' : ''})`
        }

        toast({
          title: 'Importación completada',
          description: successMessage,
        })

        // Cerrar el diálogo y resetear
        setMappingStep('upload')
        setCsvHeaders([])
        setCsvRows([])
        setFieldMappings([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Recargar la página después de un breve delay
        setTimeout(() => {
          platformRefresh()
        }, 1500)
      }
    } catch (error) {
      loadingToast.dismiss()
      console.error('Error al importar actividades:', error)
      toast({
        title: 'Error inesperado',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
      setMappingStep('map')
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleCloseDialog = () => {
    if (mappingStep !== 'importing') {
      setMappingStep('upload')
      setCsvHeaders([])
      setCsvRows([])
      setFieldMappings([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
        disabled={mappingStep === 'importing'}
      />
      <Button
        variant="outline"
        onClick={handleButtonClick}
        disabled={mappingStep === 'importing'}
      >
        <Upload className="mr-2 h-4 w-4" />
        {mappingStep === 'importing' ? 'Importando...' : 'Importar Actividades CSV'}
      </Button>

      {/* Dialog de Mapeo */}
      <Dialog open={mappingStep === 'map'} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mapear Campos del CSV</DialogTitle>
            <DialogDescription>
              Selecciona qué columna de tu CSV corresponde a cada campo para las actividades.
              El campo &quot;Identificador del Contacto&quot; es obligatorio para vincular las actividades.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {fieldMappings.map((mapping) => (
              <div key={mapping.dbKey} className="space-y-2">
                <div className="grid grid-cols-2 gap-4 items-start">
                  <div className="space-y-1">
                    <Label htmlFor={mapping.dbKey} className="flex items-center gap-2">
                      {mapping.label}
                      {mapping.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    {mapping.description && (
                      <p className="text-xs text-muted-foreground">
                        {mapping.description}
                      </p>
                    )}
                  </div>
                  <Select
                    value={mapping.csvColumn}
                    onValueChange={(value) => handleMappingChange(mapping.dbKey, value)}
                  >
                    <SelectTrigger id={mapping.dbKey}>
                      <SelectValue placeholder="Selecciona una columna..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">-- No mapear --</SelectItem>
                      {csvHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={mappingStep === 'importing'}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={mappingStep === 'importing'}
            >
              {mappingStep === 'importing' ? 'Importando...' : 'Confirmar e Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
