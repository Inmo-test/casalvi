/**
 * Abstracción de proveedor de IA.
 *
 * Permite intercambiar OpenAI por Ollama (u otro) desde `.env` sin tocar el
 * código que invoca chat o embeddings.
 *
 * Variables:
 *   AI_PROVIDER = "openai" (por defecto) | "ollama"
 *   OPENAI_API_KEY, OPENAI_CHAT_MODEL, OPENAI_EMBEDDINGS_MODEL
 *   OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL, OLLAMA_EMBEDDINGS_MODEL
 */

import OpenAI from 'openai'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIProvider {
  name: 'openai' | 'ollama'
  embeddingDims: number
  embed(text: string): Promise<number[]>
  chat(messages: ChatMessage[], opts?: { temperature?: number; maxTokens?: number }): Promise<string>
}

// --------------------------------------------------------------------- OpenAI

const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'
const OPENAI_EMBEDDINGS_MODEL = process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-small'

let _openaiClient: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (_openaiClient) return _openaiClient
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY no está configurada')
  _openaiClient = new OpenAI({ apiKey })
  return _openaiClient
}

const openaiProvider: AIProvider = {
  name: 'openai',
  embeddingDims: 1536,
  async embed(text) {
    const res = await getOpenAI().embeddings.create({
      model: OPENAI_EMBEDDINGS_MODEL,
      input: text.trim().slice(0, 8000),
    })
    return res.data[0].embedding
  },
  async chat(messages, opts = {}) {
    const res = await getOpenAI().chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens,
    })
    return res.choices[0]?.message?.content ?? ''
  },
}

// --------------------------------------------------------------------- Ollama

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3.1:8b'
const OLLAMA_EMBEDDINGS_MODEL = process.env.OLLAMA_EMBEDDINGS_MODEL || 'nomic-embed-text'

// nomic-embed-text returns 768-d vectors; pgvector columns are 1536-d, so we
// pad with zeros for binary compatibility. Real projects using Ollama should
// either run a 1536-d model or add a dedicated migration with a 768-d column.
const OLLAMA_RAW_DIMS = 768
const PADDED_DIMS = 1536

const ollamaProvider: AIProvider = {
  name: 'ollama',
  embeddingDims: PADDED_DIMS,
  async embed(text) {
    const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_EMBEDDINGS_MODEL,
        prompt: text.trim().slice(0, 8000),
      }),
    })
    if (!res.ok) throw new Error(`Ollama embeddings error: ${res.status}`)
    const data = (await res.json()) as { embedding: number[] }
    const vec = data.embedding
    if (vec.length >= PADDED_DIMS) return vec.slice(0, PADDED_DIMS)
    return [...vec, ...new Array(PADDED_DIMS - vec.length).fill(0)]
  },
  async chat(messages, opts = {}) {
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_CHAT_MODEL,
        messages,
        stream: false,
        options: {
          temperature: opts.temperature ?? 0.3,
          num_predict: opts.maxTokens,
        },
      }),
    })
    if (!res.ok) throw new Error(`Ollama chat error: ${res.status}`)
    const data = (await res.json()) as { message?: { content?: string } }
    return data.message?.content ?? ''
  },
}

// --------------------------------------------------------------------- export

export function getAIProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER || 'openai').toLowerCase()
  if (name === 'ollama') return ollamaProvider
  return openaiProvider
}
