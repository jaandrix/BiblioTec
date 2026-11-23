import { useSyncExternalStore } from 'react'
import type { Criterio, Libro } from './tipos'

export interface Config {
  criterios: Record<string, Criterio>
  extra: Record<string, number>
  guiaSuelo: boolean
}

export interface Coleccion {
  anadidos: Libro[]
  pendientes: string[]
  carro: string[]
  hoy: { fecha: string; n: number }
}

interface Estado {
  dentro: boolean
  apuntado: string | null
  abierto: string | null
  guia: string | null
  terminal: boolean
  menuOrden: string | null
  aviso: { texto: string; n: number } | null
  config: Config
  coleccion: Coleccion
}

export const MAX_CARRO = 20
const CLAVE_CONFIG = 'bibliotec-config-v1'
const CLAVE_COLECCION = 'bibliotec-coleccion-v1'
// Mientras no hay enlace con Bitácora, estos libros de ejemplo esperan en la
// entrada la primera vez, para que haya algo que ordenar.
const PENDIENTES_INICIALES = ['demo_OL8479867W', 'demo_OL46125W', 'demo_OL17075811W', 'demo_OL21745884W', 'demo_OL14860424W', 'demo_OL26387829W']

const hoyCivil = () => new Date().toLocaleDateString('sv-SE')

function leer<T>(clave: string, porDefecto: T): T {
  try {
    const v = localStorage.getItem(clave)
    return v ? { ...porDefecto, ...JSON.parse(v) } : porDefecto
  } catch {
    return porDefecto
  }
}

function guardar(clave: string, valor: unknown) {
  // Hasta que haya cuentas (fase 5), todo vive en este navegador.
  try { localStorage.setItem(clave, JSON.stringify(valor)) } catch { /* sin almacenamiento */ }
}

let estado: Estado = {
  dentro: false,
  apuntado: null,
  abierto: null,
  guia: null,
  terminal: false,
  menuOrden: null,
  aviso: null,
  config: leer<Config>(CLAVE_CONFIG, { criterios: {}, extra: {}, guiaSuelo: true }),
  coleccion: leer<Coleccion>(CLAVE_COLECCION, { anadidos: [], pendientes: PENDIENTES_INICIALES, carro: [], hoy: { fecha: hoyCivil(), n: 0 } }),
}
const oyentes = new Set<() => void>()

export function cambiarEstado(parcial: Partial<Estado>) {
  const siguiente = { ...estado, ...parcial }
  if ((Object.keys(parcial) as (keyof Estado)[]).every(k => siguiente[k] === estado[k])) return
  if (siguiente.config !== estado.config) guardar(CLAVE_CONFIG, siguiente.config)
  if (siguiente.coleccion !== estado.coleccion) guardar(CLAVE_COLECCION, siguiente.coleccion)
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

export function alternarGuiaSuelo() {
  cambiarEstado({ config: { ...estado.config, guiaSuelo: !estado.config.guiaSuelo } })
}

function cambiarColeccion(f: (c: Coleccion) => Partial<Coleccion>) {
  cambiarEstado({ coleccion: { ...estado.coleccion, ...f(estado.coleccion) } })
}

export function alCarro(ids: string[]) {
  cambiarColeccion(c => {
    const caben = ids.filter(id => c.pendientes.includes(id)).slice(0, MAX_CARRO - c.carro.length)
    return { pendientes: c.pendientes.filter(id => !caben.includes(id)), carro: [...c.carro, ...caben] }
  })
}

export function colocar(ids: string[]) {
  cambiarColeccion(c => {
    const hoy = c.hoy.fecha === hoyCivil() ? c.hoy.n : 0
    const salen = ids.filter(id => c.carro.includes(id) || c.pendientes.includes(id))
    return {
      carro: c.carro.filter(id => !salen.includes(id)),
      pendientes: c.pendientes.filter(id => !salen.includes(id)),
      hoy: { fecha: hoyCivil(), n: hoy + salen.length },
    }
  })
}

export function anadirPendiente(libro: Libro) {
  cambiarColeccion(c => ({
    anadidos: [...c.anadidos.filter(l => l.id !== libro.id), libro],
    pendientes: c.pendientes.includes(libro.id) ? c.pendientes : [...c.pendientes, libro.id],
  }))
}

let numAviso = 0
export function avisar(texto: string) {
  cambiarEstado({ aviso: { texto, n: ++numAviso } })
}

export function hechosHoy() {
  const h = estado.coleccion.hoy
  return h.fecha === hoyCivil() ? h.n : 0
}

export function useEstado<T>(elegir: (e: Estado) => T): T {
  return useSyncExternalStore(
    o => { oyentes.add(o); return () => oyentes.delete(o) },
    () => elegir(estado),
  )
}
