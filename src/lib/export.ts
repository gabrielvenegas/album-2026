import html2canvas from 'html2canvas'

export async function exportElementAsImage(element: HTMLElement, filename = 'repetidas.png') {
  const canvas = await html2canvas(element, {
    backgroundColor: '#080c0a',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export function formatDuplicatesAsText(duplicates: { country: string; flag: string; stickers: { code: string; count: number }[] }[]): string {
  if (duplicates.length === 0) return 'Nenhuma repetida ainda.'
  const lines = duplicates.map(c => {
    const items = c.stickers.map(s => `${s.code}(${s.count - 1}x)`).join(' ')
    return `${c.flag} ${c.country}: ${items}`
  })
  return lines.join('\n')
}
