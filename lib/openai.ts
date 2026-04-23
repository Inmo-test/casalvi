import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-build',
  organization: process.env.OPENAI_ORGANIZATION_ID,
})

export const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini' // Optimizado para costes
export const defaultTemperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
export const defaultMaxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '2000')


