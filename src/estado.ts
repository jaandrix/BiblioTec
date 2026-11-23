import { useSyncExternalStore } from 'react'

interface Estado {
  dentro: boolean
  apuntado: string | null
  abierto: string | null
}

let estado: Estado = { dentro: false, apuntado: null, abierto: null }
const oyentes = new Set<() => void>()

export function cambiarEstado(parcial: Partial<Estado>) {
  const siguiente = { ...estado, ...parcial }
  if ((Object.keys(parcial) as (keyof Estado)[]).every(k => siguiente[k] === estado[k])) return
  estado = siguiente
  oyentes.forEach(o => o())
}

export function leerEstado() {
  return estado
}

export function useEstado<T>(elegir: (e: Estado) => T): T {
  return useSyncExternalStore(
    o => { oyentes.add(o); return () => oyentes.delete(o) },
    () => elegir(estado),
  )
}
