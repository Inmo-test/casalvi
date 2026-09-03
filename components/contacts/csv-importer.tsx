'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from "@/components/ui"
import { Upload, Lock } from 'lucide-react'
import Papa from 'papaparse'
import { importContacts, canImportCSV } from '@/app/actions/contacts'
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
}

// Campos destino de Casalvi
const TARGET_FIELDS: Omit<FieldMapping, 'csvColumn'>[] = [
  { dbKey: 'first_name', label: 'Nombre', required: true },
  { dbKey: 'last_name', label: 'Apellidos', required: false },
  { dbKey: 'email', label: 'Email', required: false },
  { dbKey: 'phone', label: 'Teléfono', required: false },
  { dbKey: 'role', label: 'Rol', required: false },
  { dbKey: 'street', label: 'Dirección', required: false },
  { dbKey: 'budget_max', label: 'Presupuesto', required: false },
]

export function CsvImporter() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mappingStep, setMappingStep] = useState<MappingStep>('upload')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [canImport, setCanImport] = useState<boolean | null>(null) // null = cargando
  const { toast } = useToast()

  // Verificar permiso al montar el componente
  useEffect(() => {
    async function checkPermission() {
      const result = await canImportCSV()
      setCanImport(result.allowed)

      // Si no tiene permiso, mostrar toast informativo (opcional)
      if (!result.allowed && result.message) {
        // No mostramos toast automático para no ser intrusivos
        // El botón bloqueado ya es suficiente feedback visual
      }
    }
    checkPermission()
  }, [])

  // Función para adivinar automáticamente el mapeo
  const guessMapping = (header: string, targetField: string): boolean => {
    const normalizedHeader = header.trim().toLowerCase()
    const normalizedTarget = targetField.toLowerCase()

    // Mapeo inteligente de coincidencias
    const matches: Record<string, string[]> = {
      first_name: ['nombre', 'nombre completo', 'first name', 'firstname', 'name', 'primer nombre'],
      last_name: ['apellidos', 'apellido', 'last name', 'lastname', 'surname', 'segundo nombre'],
      email: ['email', 'correo', 'correo electrónico', 'e-mail', 'mail', 'e-mail address'],
      phone: ['teléfono', 'telefono', 'móvil', 'movil', 'celular', 'phone', 'tel', 'teléfono móvil', 'phone number'],
      role: ['rol', 'tipo', 'tipo de contacto', 'role', 'type', 'categoría'],
      street: ['dirección', 'direccion', 'calle', 'street', 'address', 'dirección completa', 'direccion completa'],
      budget_max: ['presupuesto', 'presupuesto máximo', 'budget', 'budget max', 'budget_max', 'presupuesto max'],
    }

    const possibleMatches = matches[normalizedTarget] || []
    return possibleMatches.some(match => normalizedHeader.includes(match) || match.includes(normalizedHeader))
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
      // Leer solo los headers primero
      Papa.parse(file, {
        header: true,
        delimiter: "", // Auto-detectar delimitador (coma o punto y coma)
        skipEmptyLines: 'greedy', // Ignorar líneas vacías de forma agresiva
        encoding: 'UTF-8',
        preview: 0, // Solo leer headers, no datos
        complete: (results) => {
          console.log('PapaParse Results (Headers):', results)

          if (results.errors.length > 0) {
            console.warn('Errores al parsear CSV (Headers):', results.errors)
          }

          const headers = results.meta.fields || []

          if (headers.length === 0) {
            console.error('CSV sin cabeceras. Errores:', results.errors)
            console.error('Meta información:', results.meta)
            toast({
              title: 'Error',
              description: 'El archivo CSV no tiene cabeceras válidas',
              variant: 'destructive',
            })
            return
          }

          // Leer todo el archivo para tener los datos
          Papa.parse(file, {
            header: true,
            delimiter: "", // Auto-detectar delimitador (coma o punto y coma)
            skipEmptyLines: 'greedy', // Ignorar líneas vacías de forma agresiva
            encoding: 'UTF-8',
            complete: (fullResults) => {
              console.log('PapaParse Results (Completo):', fullResults)

              const rows = fullResults.data as Record<string, string>[]

              if (rows.length === 0) {
                console.error('CSV vacío o sin datos. Errores:', fullResults.errors)
                console.error('Meta información:', fullResults.meta)
                console.error('Datos parseados:', fullResults.data)
                toast({
                  title: 'Error',
                  description: 'El archivo CSV está vacío o no tiene datos válidos. Revisa la consola para más detalles.',
                  variant: 'destructive',
                })
                return
              }

              // Inicializar mapeos con auto-detección
              const initialMappings = initializeMappings(headers)

              setCsvHeaders(headers)
              setCsvRows(rows)
              setFieldMappings(initialMappings)
              setMappingStep('map')
            },
            error: (error) => {
              console.error('Error al leer CSV completo:', error)
              toast({
                title: 'Error al leer archivo',
                description: 'No se pudo leer el archivo CSV. Verifica que el formato sea correcto.',
                variant: 'destructive',
              })
            },
          })
        },
        error: (error) => {
          console.error('Error al leer CSV (Headers):', error)
          toast({
            title: 'Error al leer archivo',
            description: 'No se pudo leer el archivo CSV. Verifica que el formato sea correcto.',
            variant: 'destructive',
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
    // Validar que el campo requerido (Nombre) esté mapeado
    const nombreMapping = fieldMappings.find(m => m.dbKey === 'first_name')
    if (!nombreMapping || !nombreMapping.csvColumn || nombreMapping.csvColumn === 'ignore') {
      toast({
        title: 'Campo requerido',
        description: 'Debes mapear el campo "Nombre" a una columna del CSV',
        variant: 'destructive',
      })
      return
    }

    setMappingStep('importing')

    // Mostrar toast de carga
    const loadingToast = toast({
      title: 'Importando...',
      description: 'Procesando archivo CSV...',
    })

    try {
      // Re-mapear las filas del CSV a nuestro formato
      const transformedContacts = csvRows.map(row => {
        const transformed: Record<string, any> = {}

        fieldMappings.forEach(mapping => {
          // Ignorar si el campo está configurado como "ignore" o está vacío
          if (!mapping.csvColumn || mapping.csvColumn === 'ignore') {
            return
          }

          if (row[mapping.csvColumn]) {
            const value = row[mapping.csvColumn].trim()
            if (value) {
              transformed[mapping.dbKey] = value
            }
          }
        })

        return transformed
      })

      // Llamar a la Server Action
      const result = await importContacts(transformedContacts)

      // Cerrar toast de carga
      loadingToast.dismiss()

      if (!result.success) {
        const errorMsg = 'error' in result ? result.error : 'Error en la importación'
        // Mejora: Mostrar errores específicos si el backend los devuelve
        if (errorMsg.includes('duplicate')) {
          toast({
            title: '⚠️ Duplicados detectados',
            description: 'Algunos contactos ya existían. Se han actualizado con los nuevos datos.',
            variant: 'default', // Naranja/Amarillo en lugar de Rojo destructivo
            className: 'bg-yellow-50 border-yellow-200 text-yellow-900'
          })
          // Aún así consideramos éxito parcial y cerramos
          setMappingStep('upload')
          setCsvHeaders([])
          setCsvRows([])
          setFieldMappings([])
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          setTimeout(() => {
            platformRefresh()
          }, 1500)
          return
        }

        // Error real
        toast({
          title: 'Error en la importación',
          description: errorMsg,
          variant: 'destructive',
        })
        // No cerramos el diálogo para que pueda reintentar
        setMappingStep('map')
      } else if (result.success && 'count' in result) {
        toast({
          title: '✅ Importación exitosa',
          description: `${result.count} contacto${result.count !== 1 ? 's' : ''} importado${result.count !== 1 ? 's' : ''} correctamente`,
        })

        // Cerrar el diálogo y resetear
        setMappingStep('upload')
        setCsvHeaders([])
        setCsvRows([])
        setFieldMappings([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Recargar la página para mostrar los nuevos contactos
        setTimeout(() => {
          platformRefresh()
        }, 1000)
      }
    } catch (error) {
      loadingToast.dismiss()
      console.error('Error al importar contactos:', error)
      toast({
        title: 'Error inesperado',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
      setMappingStep('map')
    }
  }

  const handleButtonClick = () => {
    // Si no tiene permiso, mostrar mensaje y no abrir el selector de archivos
    if (canImport === false) {
      toast({
        title: 'Función Premium',
        description: 'La importación masiva es una función Pro. Actualiza tu plan para importar tus bases de datos.',
        variant: 'default',
      })
      return
    }

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
      {canImport ? (
        // CASO A: TIENE PERMISO -> Botón normal funcional
        <Button
          variant="outline"
          onClick={handleButtonClick}
          disabled={mappingStep === 'importing'}
        >
          <Upload className="mr-2 h-4 w-4" />
          {mappingStep === 'importing' ? 'Importando...' : 'Importar CSV'}
        </Button>
      ) : (
        // CASO B: NO TIENE PERMISO -> Botón bloqueado con candado
        <Button
          variant="outline"
          disabled
          onClick={handleButtonClick}
          className="opacity-70 cursor-not-allowed"
        >
          <Lock className="mr-2 h-4 w-4 text-amber-500" />
          Importar CSV (Pro)
        </Button>
      )}

      {/* Dialog de Mapeo */}
      <Dialog open={mappingStep === 'map'} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mapear Campos del CSV</DialogTitle>
            <DialogDescription>
              Se han detectado <strong>{csvRows.length}</strong> contacto{csvRows.length !== 1 ? 's' : ''}.
              Mapea las columnas para continuar. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {fieldMappings.map((mapping) => (
              <div key={mapping.dbKey} className="grid grid-cols-2 gap-4 items-center">
                <Label htmlFor={mapping.dbKey} className="flex items-center gap-2">
                  {mapping.label}
                  {mapping.required && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
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
