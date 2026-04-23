# Web App - Casalvi AI CRM

Aplicación Next.js 14 principal del CRM.

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

Copia el archivo `.env.template` a `.env.local`:

```bash
cp .env.template .env.local
```

Luego edita `.env.local` con tus credenciales:

#### Supabase
1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. En Settings → API, encontrarás:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key

#### OpenAI
1. Ve a [OpenAI Platform](https://platform.openai.com)
2. En API Keys, crea una nueva clave
3. Copia el valor a `OPENAI_API_KEY`
4. (Opcional) Si tienes una organización, añade el ID en `OPENAI_ORGANIZATION_ID`

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Iniciar el Servidor de Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📂 Estructura de Carpetas

```
apps/web/
├── app/              # App Router de Next.js
│   ├── layout.tsx    # Layout principal
│   ├── page.tsx      # Página de inicio
│   └── globals.css   # Estilos globales
├── components/       # Componentes React
│   └── ui/           # Componentes Shadcn/UI
├── lib/              # Utilidades y configuración
│   ├── utils.ts      # Funciones helper
│   ├── supabase.ts   # Cliente de Supabase
│   └── openai.ts     # Cliente de OpenAI
└── public/           # Archivos estáticos
```

## 🎨 Shadcn/UI

Para añadir nuevos componentes de Shadcn/UI:

```bash
npx shadcn-ui@latest add [component-name]
```

Por ejemplo:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

## 🛠️ Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **Shadcn/UI** - Componentes de UI
- **Supabase** - Base de datos y autenticación
- **OpenAI** - Integración de IA



