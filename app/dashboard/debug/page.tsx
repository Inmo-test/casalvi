import { createClient } from '@/lib/supabase/server'
import { getMyAgency } from '@/app/actions/team'

export default async function DebugPage() {
    const supabase = await createClient()
    const { agency, role, user } = await getMyAgency()

    // Raw queries bypassing services to test RLS
    const { count: propertiesCount, data: props, error: propsError } = await supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .limit(5)

    const { count: contactsCount, error: contactsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })

    // Check Agency Members
    const { data: members, error: membersError } = await supabase
        .from('agency_members')
        .select('*')
        .eq('user_id', user?.id || '')

    return (
        <div className="p-10 space-y-6 bg-white min-h-screen overflow-auto text-black font-mono text-sm">
            <h1 className="text-2xl font-medium text-red-600">🛠️ Panel de Diagnóstico</h1>
            <p className="mb-4">Si ves datos aquí, el problema es el Frontend. Si no ves datos, es la Base de Datos (RLS).</p>

            <div className="border p-4 rounded bg-gray-100">
                <h2 className="font-medium text-lg mb-2">1. Contexto de Usuario</h2>
                <pre className="whitespace-pre-wrap">{JSON.stringify({ userId: user?.id, email: user?.email, agencyId: agency?.id, role }, null, 2)}</pre>
            </div>

            <div className="border p-4 rounded bg-gray-100">
                <h2 className="font-medium text-lg mb-2">2. Membresía de Agencia (DB)</h2>
                <pre className="whitespace-pre-wrap">{JSON.stringify({ members, error: membersError }, null, 2)}</pre>
                <p className="text-gray-500 mt-2">Deberías ver una entrada aquí vinculando tu usuario a la agencia.</p>
            </div>

            <div className="border p-4 rounded bg-gray-100">
                <h2 className="font-medium text-lg mb-2">3. Tabla Propiedades (RLS Check)</h2>
                <div className="mb-2">
                    <span className="font-medium">Total Visible:</span> {propertiesCount !== null ? propertiesCount : 'Error'}
                </div>
                {propsError && <div className="text-red-600 bg-red-100 p-2 rounded">Error: {propsError.message}</div>}

                {props && props.length > 0 ? (
                    <div className="mt-2">
                        <h3 className="font-medium">Muestra (primeras 5 props):</h3>
                        <pre className="text-xs bg-white p-2 border overflow-auto max-h-60">{JSON.stringify(props, null, 2)}</pre>
                    </div>
                ) : (
                    <div className="text-orange-600 font-medium">⚠️ No se encontraron propiedades visibles. RLS bloqueando o tabla vacía.</div>
                )}
            </div>

            <div className="border p-4 rounded bg-gray-100">
                <h2 className="font-medium text-lg mb-2">4. Tabla Contactos (RLS Check)</h2>
                <div className="mb-2">
                    <span className="font-medium">Total Visible:</span> {contactsCount !== null ? contactsCount : 'Error'}
                </div>
                {contactsError && <div className="text-red-600 bg-red-100 p-2 rounded">Error: {contactsError.message}</div>}
            </div>
        </div>
    )
}
