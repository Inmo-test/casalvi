'use client'

import { useState, useMemo } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    createColumnHelper,
    SortingState,
} from '@tanstack/react-table'
import type { ContactData } from '@/lib/services/contacts-service'
import { Checkbox } from "@/components/ui"
import { BulkActionsBar } from './bulk-actions-bar'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Wand2, Flame, AlertTriangle, Clock, ArrowUpDown } from "lucide-react"
import { useToast } from '@/hooks/use-toast'
import { CreateGroupDialog } from './create-group-dialog'
import { EmailComposeDialog } from './email-compose-dialog'

interface ContactsDataTableProps {
    data: any[]
}

const columnHelper = createColumnHelper<any>()

export function ContactsDataTable({ data }: ContactsDataTableProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    // Dialog States
    const [showGroupDialog, setShowGroupDialog] = useState(false)
    const [showEmailDialog, setShowEmailDialog] = useState(false)

    // Definición de Columnas
    const columns = useMemo(() => [
        // 1. Selector (Checkbox)
        columnHelper.display({
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllRowsSelected() || (table.getIsSomeRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
                    aria-label="Select all"
                    className="mr-2"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="mr-2"
                />
            ),
        }),

        // 2. Nombre y Avatar
        columnHelper.accessor('first_name', {
            header: 'Contacto',
            cell: info => {
                const row = info.row.original
                return (
                    <div className="flex items-center gap-3 py-1">
                        <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center font-medium
                ${row.role === 'owner' ? 'bg-orange-100 text-orange-700' :
                                row.role === 'buyer' ? 'bg-blue-100 text-[#0062CC]' : 'bg-slate-100 text-slate-700'}
            `}>
                            {row.first_name?.[0]}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground group-hover:text-[#007AFF] dark:group-hover:text-blue-400 transition-colors">
                                {row.first_name} {row.last_name || ''}
                            </span>
                            <span className="text-xs text-muted-foreground">{row.email || row.phone || '-'}</span>
                        </div>
                    </div>
                )
            }
        }),

        // 3. Rol
        columnHelper.accessor('role', {
            header: ({ column }) => {
                return (
                    <button
                        className="flex items-center hover:text-[#007AFF] transition-colors"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Rol
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                )
            },
            cell: info => {
                const role = info.getValue()
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
              ${role === 'owner' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                            role === 'buyer' ? 'bg-blue-50 text-[#0062CC] border border-blue-100' : 'bg-slate-50 text-slate-700 border border-slate-100'}
           `}>
                        {role === 'owner' ? 'Propietario' : role === 'buyer' ? 'Comprador' : role}
                    </span>
                )
            }
        }),

        // 4. Score (Probabilidad)
        columnHelper.accessor('conversion_probability', {
            header: ({ column }) => {
                return (
                    <button
                        className="flex items-center hover:text-[#007AFF] transition-colors"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Score
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                    </button>
                )
            },
            cell: info => {
                const prob = info.getValue() || 0
                return (
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${prob >= 70 ? 'bg-emerald-500' :
                                    prob >= 40 ? 'bg-amber-500' : 'bg-slate-300'
                                    }`}
                                style={{ width: `${prob}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{prob > 0 ? `${prob}%` : '-'}</span>
                    </div>
                )
            }
        }),

        // 5. Ubicación (Smart Geo Placeholder for now)
        columnHelper.accessor('formatted_address', {
            header: 'Zona',
            cell: info => {
                const addr = info.getValue()
                // Extraer ciudad o calle simple
                const simple = addr ? addr.split(',')[0] : '-'
                return <span className="text-sm text-slate-500 truncate max-w-[150px] block">{simple}</span>
            }
        }),
        // 6. Insights (Nueva Columna)
        columnHelper.accessor('insights', {
            header: 'Insights',
            cell: info => {
                const insights = info.getValue() || {}
                return (
                    <div className="flex items-center gap-1.5">
                        {insights.zone_density === 'hot' && (
                            <div className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 text-[10px] font-medium uppercase flex items-center gap-1" title="Zona Caliente (Alta Demanda)">
                                <Flame className="h-3 w-3" />
                                <span>HOT</span>
                            </div>
                        )}
                        {insights.churn_risk === 'high' && (
                            <div className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-medium uppercase flex items-center gap-1" title="Riesgo de Abandono (Sin actividad reciente)">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Risk</span>
                            </div>
                        )}
                        <div className="text-[10px] text-slate-400 flex items-center gap-1" title="Última interacción">
                            <Clock className="h-3 w-3" />
                            <span>{insights.last_interaction_days || 2}d</span>
                        </div>
                    </div>
                )
            }
        })

    ], [])

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            rowSelection,
        },
        enableRowSelection: true,
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getRowId: row => row.id, // CRITICAL: Use UUID for selection keys
    })

    // Acciones Masivas
    const handleBulkAction = (action: string) => {
        const selectedIds = Object.keys(rowSelection)
        console.log(`Ejecutando ${action} para: ${selectedIds.length} contactos.`)

        if (action === 'group') {
            setShowGroupDialog(true)
            return
        }

        if (action === 'email') {
            setShowEmailDialog(true)
            return
        }

        // Aquí implementaremos la lógica real más adelante
        alert(`Acción: ${action}\nContactos: ${selectedIds.length}`)
    }

    return (
        <div className="relative">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/40 text-muted-foreground font-medium uppercase text-xs tracking-wider border-b border-border">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} className="px-4 py-3 h-10 font-semibold align-middle [&:has([role=checkbox])]:pr-0">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 w-[50px]"></th>
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-border bg-card dark:bg-card/95">
                            {table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className={`
                                    group transition-colors hover:bg-muted/50
                                    ${row.getIsSelected() ? 'bg-blue-50/40 dark:bg-blue-900/20 hover:bg-blue-50/60 dark:hover:bg-blue-900/30' : ''}
                                `}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0">
                                            {/* Si es celda de selección, no queremos que navegue al hacer click */}
                                            {cell.column.id === 'select' ? (
                                                flexRender(cell.column.columnDef.cell, cell.getContext())
                                            ) : (
                                                <Link href={`/dashboard/contacts/${row.original.id}`} className="block w-full h-full">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </Link>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                        <Link href={`/dashboard/contacts/${row.original.id}`} className="text-muted-foreground hover:text-[#007AFF] dark:hover:text-blue-400 block p-1.5">
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                        No hay resultados.
                    </div>
                )}
            </div>

            <BulkActionsBar
                selectedCount={Object.keys(rowSelection).length}
                onClearSelection={() => setRowSelection({})}
                onAction={handleBulkAction}
            />

            <CreateGroupDialog
                open={showGroupDialog}
                onOpenChange={setShowGroupDialog}
                selectedContactIds={Object.keys(rowSelection)}
                onGroupCreated={() => {
                    setRowSelection({}) // Limpiar selección tras crear grupo
                    // Opcional: Recargar grupos sidebar si tuviéramos acceso, pero Next.js revalidatePath lo hará
                }}
            />

            <EmailComposeDialog
                open={showEmailDialog}
                onOpenChange={setShowEmailDialog}
                selectedContactIds={Object.keys(rowSelection)}
                onEmailSent={() => setRowSelection({})}
            />
        </div>
    )
}
