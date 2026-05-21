import { Copy, Globe, Home, ScanLine, Settings, type LucideIcon } from 'lucide-react'

export interface AppTab {
  path: string
  label: string
  Icon: LucideIcon
}

export const APP_TABS: AppTab[] = [
  { path: '/', label: 'Início', Icon: Home },
  { path: '/paises', label: 'Países', Icon: Globe },
  { path: '/scanner', label: 'Scanner', Icon: ScanLine },
  { path: '/repetidas', label: 'Repetidas', Icon: Copy },
  { path: '/config', label: 'Config', Icon: Settings },
]

export function isTabActive(pathname: string, tabPath: string): boolean {
  return tabPath !== '/'
    ? pathname.startsWith(tabPath)
    : pathname === '/'
}
