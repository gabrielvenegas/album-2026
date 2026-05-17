import { COUNTRIES, getStickerCode } from '@/data/album'

const BASE_URL = 'https://api.mulerouter.ai/vendors/openai/v1'
const TEXT_MODEL = 'qwen-flash'
const VISION_MODEL = 'qwen3-vl-flash'
const REQUEST_TIMEOUT_MS = 45000
const VALID_STICKER_CODES = new Set(
  COUNTRIES.flatMap(country => country.stickers.map(sticker => getStickerCode(country.code, sticker.number)))
)
const VALID_PREFIXES = COUNTRIES.map(country => country.code).join(', ')

class AiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

async function chat(
  apiKey: string,
  messages: { role: string; content: unknown }[],
  options: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  return chatWithModel(apiKey, messages, options.model ?? TEXT_MODEL, options.maxTokens)
}

async function chatWithModel(
  apiKey: string,
  messages: { role: string; content: unknown }[],
  model: string,
  maxTokens = 500
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${normalizeApiKey(apiKey)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0,
        max_tokens: maxTokens,
      }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      throw new AiRequestError(cleanApiError(err), res.status)
    }
    const data = await res.json() as { choices: { message: { content: string } }[] }
    return data.choices[0]?.message?.content ?? ''
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Tempo esgotado ao analisar a imagem. Tente uma foto menor ou mais clara.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeApiKey(apiKey: string): string {
  return apiKey.trim().replace(/^Bearer\s+/i, '')
}

function cleanApiError(error: string): string {
  try {
    const parsed = JSON.parse(error) as { error?: { message?: string }; message?: string }
    return parsed.error?.message ?? parsed.message ?? error
  } catch {
    return error
  }
}

export async function testConnection(apiKey: string): Promise<boolean> {
  const reply = await chat(apiKey, [
    { role: 'system', content: 'Responda apenas com: OK' },
    { role: 'user', content: 'Teste de conexão' },
  ])
  return /\bOK\b/i.test(reply.trim())
}

export async function scanStickersFromImage(apiKey: string, base64Image: string): Promise<string[]> {
  const reply = await chat(apiKey, [
    {
      role: 'system',
      content: `Você é um assistente especializado em identificar figurinhas do álbum Panini da Copa do Mundo 2026.
Analise a imagem e leia todos os códigos de figurinhas visíveis. Os códigos geralmente aparecem impressos na borda da figurinha.
Use apenas estes códigos de país: ${VALID_PREFIXES}.
Cada país tem números de 1 a 20.
O formato final é: CÓDIGO_PAÍS NÚMERO (ex: BRA 1, ARG 15, MEX 7).
Não invente códigos quando a imagem estiver borrada ou cortada.
Retorne APENAS um array JSON com os códigos encontrados, sem explicações.
Exemplo: ["BRA 1", "ARG 7", "MEX 3"]
Se não encontrar nenhuma figurinha, retorne: []`,
    },
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: base64Image },
        },
        {
          type: 'text',
          text: 'Leia somente os códigos das figurinhas nesta imagem. Retorne JSON puro.',
        },
      ],
    },
  ], { model: VISION_MODEL, maxTokens: 300 })

  const match = reply.match(/\[[\s\S]*\]/)
  if (!match) return normalizeStickerCodes(reply)
  try {
    const codes = JSON.parse(match[0]) as unknown[]
    return normalizeStickerCodes(codes.filter((c): c is string => typeof c === 'string').join(' '))
  } catch {
    return normalizeStickerCodes(reply)
  }
}

function normalizeStickerCodes(input: string): string[] {
  const seen = new Set<string>()
  const matches = input.toUpperCase().match(/[A-Z]{3}\s*[-#]?\s*\d{1,2}/g) ?? []
  for (const match of matches) {
    const parts = match.match(/^([A-Z]{3})\s*[-#]?\s*(\d{1,2})$/)
    if (!parts) continue
    const code = `${parts[1]} ${Number(parts[2])}`
    if (VALID_STICKER_CODES.has(code)) seen.add(code)
  }
  return [...seen]
}

export async function generateSwapMessage(apiKey: string, duplicates: { code: string; count: number }[]): Promise<string> {
  if (duplicates.length === 0) return 'Você não tem figurinhas repetidas no momento.'

  const list = duplicates
    .map(d => `${d.code} (${d.count - 1}x para trocar)`)
    .join(', ')

  return chat(apiKey, [
    {
      role: 'system',
      content: `Você é um assistente que ajuda colecionadores a trocar figurinhas da Copa do Mundo 2026.
Crie uma mensagem amigável e bem formatada para compartilhar em grupos de WhatsApp/Telegram.
Use emojis de futebol e copa do mundo.
A mensagem deve estar em português brasileiro.
Seja conciso mas entusiasmado.`,
    },
    {
      role: 'user',
      content: `Gere uma mensagem para trocar minhas figurinhas repetidas. Tenho para trocar: ${list}`,
    },
  ])
}

export async function predictCompletion(
  apiKey: string,
  stats: { owned: number; total: number; duplicates: number; worstCountries: string[] }
): Promise<string> {
  const pct = ((stats.owned / stats.total) * 100).toFixed(1)
  const missing = stats.total - stats.owned

  return chat(apiKey, [
    {
      role: 'system',
      content: `Você é um especialista em coleções de figurinhas Panini.
Dê uma análise divertida e motivacional sobre o progresso da coleção em português brasileiro.
Use dados estatísticos reais: cada pacote tem 5 figurinhas aleatórias, o álbum tem ${stats.total} figurinhas.
Seja conciso (3-4 parágrafos), use emojis e mantenha o tom animado.`,
    },
    {
      role: 'user',
      content: `Minha coleção: ${pct}% completa. Tenho ${stats.owned} figurinhas de ${stats.total}.
Repetidas: ${stats.duplicates}. Faltam: ${missing} figurinhas.
Países mais incompletos: ${stats.worstCountries.join(', ')}.
Qual é minha situação e quanto falta para completar?`,
    },
  ])
}
