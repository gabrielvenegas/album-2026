const BASE_URL = 'https://api.mulerouter.ai/vendors/openai/v1'
const TEXT_MODEL = 'qwen-flash'
const VISION_MODEL = 'qwen3-vl-flash'
const REQUEST_TIMEOUT_MS = 45000

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
O formato final é: CÓDIGO_PAÍS NÚMERO (ex: BRA 1, ARG 15, MEX 7), exceto códigos especiais.
Também leia códigos especiais como 00, FWC 1 a FWC 19, e Coca-Cola CC1 a CC14.
Aceite qualquer código de país ou seção com 2 ou 3 letras, sem restringir a uma lista pré-existente.
Não invente códigos quando a imagem estiver borrada ou cortada.
Se o mesmo código aparecer mais de uma vez na imagem, repita esse código no array uma vez para cada cópia visível.
Retorne APENAS um array JSON com os códigos encontrados, sem explicações.
Exemplo: ["00", "BRA 1", "BRA 1", "FWC 7", "CC1"]
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
  const matches = input.toUpperCase().match(/\b(?:00|CC\s*[-#]?\s*\d{1,2}|[A-Z]{3}\s*[-#]?\s*\d{1,2})\b/g) ?? []
  return matches.flatMap(match => {
    if (match === '00') return '00'
    const ccParts = match.match(/^CC\s*[-#]?\s*(\d{1,2})$/)
    if (ccParts) return `CC${Number(ccParts[1])}`
    const parts = match.match(/^([A-Z]{3})\s*[-#]?\s*(\d{1,2})$/)
    if (!parts) return []
    return `${parts[1]} ${Number(parts[2])}`
  })
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

export async function parseDuplicateListWithAi(
  apiKey: string,
  input: string,
): Promise<string[]> {
  const reply = await chat(apiKey, [
    {
      role: 'system',
      content: `Você extrai códigos de figurinhas repetidas do álbum da Copa do Mundo 2026 a partir de listas copiadas de WhatsApp, planilhas, notas ou mensagens soltas.
Aceite formatos variados, com ou sem separadores, como:
- BRA 1, BRA-1, BRA#1, BRA01, BRA: 1 2 3
- CC1, CC 1, FWC 7, 00
- quantidades como BRA 1 x2, BRA 1 (2x), 2x BRA 1
Retorne uma entrada para cada cópia repetida listada. Se a lista disser BRA 1 x3, retorne "BRA 1" três vezes.
Normalize para estes formatos: "00", "CC1", "FWC 7", ou "BRA 1".
Não invente códigos que não estejam explícitos no texto.
Retorne APENAS um array JSON de strings, sem explicações.`,
    },
    {
      role: 'user',
      content: input,
    },
  ], { maxTokens: 900 })

  const match = reply.match(/\[[\s\S]*\]/)
  if (!match) return normalizeStickerCodes(reply)
  try {
    const codes = JSON.parse(match[0]) as unknown[]
    return normalizeStickerCodes(codes.filter((c): c is string => typeof c === 'string').join(' '))
  } catch {
    return normalizeStickerCodes(reply)
  }
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
