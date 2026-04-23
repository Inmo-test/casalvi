
import { dictionaries } from '../lib/i18n/dictionaries'
import fs from 'fs'
import path from 'path'

const OUT_DIR = path.join(process.cwd(), 'apps/web/i18n')
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
}

const keys = Object.keys(dictionaries) as (keyof typeof dictionaries)[]
keys.forEach(lang => {
    const data = dictionaries[lang]
    fs.writeFileSync(path.join(OUT_DIR, `${lang}.json`), JSON.stringify(data, null, 4))
    console.log(`Exported ${lang}.json`)
})
