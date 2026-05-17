const BASE_URL = 'https://api.mulerouter.ai/vendors/openai/v1'
const MODEL = 'qwen3-max'

async function chat(apiKey: string, messages: { role: string; content: unknown }[]): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(err)
  }
  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message?.content ?? ''
}

export async function testConnection(apiKey: string): Promise<boolean> {
  const reply = await chat(apiKey, [
    { role: 'system', content: 'Responda apenas com: OK' },
    { role: 'user', content: 'Teste de conexão' },
  ])
  return reply.trim().startsWith('OK')
}

export async function scanStickersFromImage(apiKey: string, base64Image: string): Promise<string[]> {
  const reply = await chat(apiKey, [
    {
      role: 'system',
      content: `Você é um assistente especializado em identificar figurinhas do álbum Panini da Copa do Mundo 2026.
Analise a imagem e identifique todos os códigos de figurinhas visíveis.
O formato é: CÓDIGO_PAÍS NÚMERO (ex: BRA 1, ARG 15, MEX 7, FWC 3).
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
          text: 'Quais são os códigos de figurinhas nesta imagem?',
        },
      ],
    },
  ])

  // Extract JSON array from reply
  const match = reply.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const codes = JSON.parse(match[0]) as unknown[]
    return codes.filter((c): c is string => typeof c === 'string')
  } catch {
    return []
  }
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
