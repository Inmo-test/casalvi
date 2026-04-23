import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'

// Usage: npx tsx apps/web/scripts/generate-i18n.ts

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.resolve(__dirname, '../.env.local')
try { process.loadEnvFile(envPath) } catch (e) {
    try { process.loadEnvFile('.env') } catch (e) { /* ignore */ }
}

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
})

const I18N_DIR = path.resolve(__dirname, '../i18n')
const DICTIONARIES_FILE = path.resolve(__dirname, '../lib/i18n/dictionaries.ts')

// Ensure i18n dir exists
if (!fs.existsSync(I18N_DIR)) {
    console.error(`i18n directory not found at ${I18N_DIR}`)
    process.exit(1)
}

const TARGET_LANGS = ['en', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'pl', 'uk', 'ro', 'nl']

// Recursive function to find missing keys
function findMissingKeys(source: any, target: any, prefix = ''): Record<string, string> {
    const missing: Record<string, string> = {}

    for (const key in source) {
        const sourceVal = source[key]
        const targetVal = target?.[key]
        const currentPath = prefix ? `${prefix}.${key}` : key

        if (typeof sourceVal === 'object' && sourceVal !== null) {
            // Nested object
            const nestedMissing = findMissingKeys(sourceVal, targetVal || {}, currentPath)
            Object.assign(missing, nestedMissing)
        } else if (typeof sourceVal === 'string') {
            // Leaf string
            if (targetVal === undefined || targetVal === '' || targetVal === null) {
                // Missing or empty
                missing[currentPath] = sourceVal
            }
        }
    }
    return missing
}

// Deep merge helper
function setDeepValue(obj: any, pathStr: string, value: string) {
    const parts = pathStr.split('.')
    let current = obj
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (!current[part]) current[part] = {}
        current = current[part]
    }
    current[parts[parts.length - 1]] = value
}

async function translateBatch(items: Record<string, string>, targetLang: string) {
    // We send a JSON object of key-value pairs to translate
    // OpenAI is good at returning JSON

    const keys = Object.keys(items)
    if (keys.length === 0) return {}

    console.log(` Translating ${keys.length} keys to ${targetLang}...`)

    // chunking might be needed if too large, but for now take all
    // Or chunk by 20 keys
    const chunks: string[][] = []
    let currentChunk: string[] = []

    keys.forEach(k => {
        currentChunk.push(k)
        if (currentChunk.length >= 20) {
            chunks.push(currentChunk)
            currentChunk = []
        }
    })
    if (currentChunk.length > 0) chunks.push(currentChunk)

    const results: Record<string, string> = {}

    for (const chunk of chunks) {
        const inputObj: Record<string, string> = {}
        chunk.forEach(k => inputObj[k] = items[k])

        try {
            const response = await openai.chat.completions.create({
                model: 'deepseek-chat',
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator for a Real Estate CRM (SaaS). 
Translate the values of the JSON object provided from Spanish (es) to ${targetLang}.
Return strictly a JSON object with the same keys and translated values.
Preserve variables like {name} or placeholders if any.
Context:
- "Farming" -> Real estate farming (term of art).
- "Matchmaker" -> Matching tool.
- "Valuation" -> Property valuation.
`
                    },
                    {
                        role: 'user',
                        content: JSON.stringify(inputObj)
                    }
                ]
            })

            const content = response.choices[0].message.content
            if (content) {
                const translatedChunk = JSON.parse(content)
                Object.assign(results, translatedChunk)
            }
        } catch (e) {
            console.error(`Error translating chunk to ${targetLang}`, e)
        }
    }

    return results
}

function generateTypeDefinition(obj: any, indent = 4): string {
    const spaces = ' '.repeat(indent)
    const subSpaces = ' '.repeat(indent + 4)

    let lines: string[] = []
    lines.push('{')

    for (const key in obj) {
        const val = obj[key]
        if (typeof val === 'object' && val !== null) {
            lines.push(`${subSpaces}${key}: ${generateTypeDefinition(val, indent + 4)}`)
        } else {
            lines.push(`${subSpaces}${key}: string`)
        }
    }
    lines.push(`${spaces}}`)
    return lines.join('\n')
}

async function main() {
    // 1. Load ES
    const esPath = path.join(I18N_DIR, 'es.json')
    if (!fs.existsSync(esPath)) {
        console.error('es.json not found.')
        return
    }
    const es = JSON.parse(fs.readFileSync(esPath, 'utf-8'))

    // 2. Process other langs
    const allDicts: Record<string, any> = { es } // clone deep if modifying? no

    for (const lang of TARGET_LANGS) {
        const langPath = path.join(I18N_DIR, `${lang}.json`)
        let langObj = {}
        if (fs.existsSync(langPath)) {
            langObj = JSON.parse(fs.readFileSync(langPath, 'utf-8'))
        } else {
            // Initialize with empty structure or just empty object
            // Just empty object, we will fill it
        }

        const missing = findMissingKeys(es, langObj)
        if (Object.keys(missing).length > 0) {
            const translated = await translateBatch(missing, lang)
            // Apply translations to langObj
            // We need to preserve existing langObj structure and add new keys
            // But structure might be deep.
            // We iterate missing keys and setDeepValue
            for (const keyPath in translated) {
                setDeepValue(langObj, keyPath, translated[keyPath])
            }
            // Sort keys? Ideally yes to match ES structure
            // Save JSON
            fs.writeFileSync(langPath, JSON.stringify(langObj, null, 4))
            console.log(`Saved ${lang}.json`)
        } else {
            console.log(`${lang} is up to date.`)
        }
        allDicts[lang] = langObj
    }

    // 3. Generate dictionaries.ts
    console.log('Generating dictionaries.ts...')

    const typeDef = generateTypeDefinition(es)

    const tsContent = `// Auto-generated by scripts/generate-i18n.ts
// Do not edit this file directly. Edit translations in i18n/es.json

export type Locale = 'es' | ${TARGET_LANGS.map(l => `'${l}'`).join(' | ')}

export type Dictionary = ${typeDef}

export const dictionaries: Record<Locale, Dictionary> = {
${Object.keys(allDicts).map(lang => `    ${lang}: ${JSON.stringify(allDicts[lang], null, 4)}`).join(',\n')}
}
`

    fs.writeFileSync(DICTIONARIES_FILE, tsContent)
    console.log('Done.')
}

main().catch(console.error)
