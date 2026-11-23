import { useSyncExternalStore } from 'react'
import type { Criterio } from './tipos'

export interface Config {
  criterios: Record<string, Criterio>
  extra: Record<string, number>
}

interface Estado {
  dentro: boolean
  apuntado: string | null
  abierto: string | null
  guia: string | null
  terminal: boolean
  menuOrden: string | null
  config: Config
}

const CLAVE_CONFIG = 'bibliotec-config-v1'

function cargarConfig(): Config {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE_CONFIG) || '{}')
    return { criterios: c.criterios ?? {}, extra: c.extra ?? {} }
  } catch {
    return { criterios: {}, extra: {} }
  }
}

let estado: Estado = { dentro: false, apuntado: null, abierto: null, guia: null, terminal: false, menuOrden: null, config: cargarConfig() }
const oyentes = new Set<() => void>()

export function cambiarEstado(parcial: Partial<Estado>) {
  const siguiente = { ...estado, ...parcial }
  if ((Object.keys(parcial) as (keyof Estado)[]).every(k => siguiente[k] === estado[k])) return
  if (siguiente.config !== estado.config) {
    // Hasta que haya cuentas (fase 5), la colocación vive en este navegador.
    try { localStorage.setItem(CLAVE_CONFIG, JSON.stringify(siguiente.config)) } catch { /* sin almacenamiento */ }
  }
  estado = siguiente
  oyentes.forEach(o => o())
}

export function leerEstado() {
  return estado
}

export function cambiarCriterio(seccion: string, criterio: Criterio) {
  const c = estado.config
  cambiarEstado({ config: { ...c, criterios: { ...c.criterios, [seccion]: criterio } } })
}

export function sumarModulo(seccion: string) {
  const c = estado.config
  cambiarEstado({ config: { ...c, extra: { ...c.extra, [seccion]: (c.extra[seccion] ?? 0) + 1 } } })
}

export function useEstado<T>(elegir: (e: Estado) => T): T {
  return useSyncExternalStore(
    o => { oyentes.add(o); return () => oyentes.delete(o) },
    () => elegir(estado),
  )
}
