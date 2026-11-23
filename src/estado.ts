import { useSyncExternalStore } from 'react'
import type { CajaCartas, Carta, Criterio, CriterioCartas, Libro, MuebleMapa, Sellado } from './tipos'
import pokemonDemo from './datos/pokemon-demo.json'

export interface Config {
  criterios: Record<string, Criterio>
  extra: Record<string, number>
  guiaSuelo: boolean
  sensibilidad: number
  calidad: 'alta' | 'media' | 'baja'
  calidadAuto: boolean
  fov: number
  sonido: boolean
  ejemplos: boolean
  mapa?: { muebles: MuebleMapa[] }
}

export interface Coleccion {
  anadidos: Libro[]
  pendientes: string[]
  carro: string[]
  hoy: { fecha: string; n: number }
  portadas: Record<string, string>
  expuestos: string[]
}

export interface Pokemon {
  expositor: string[]
  cajas: CajaCartas[]
  criterio: CriterioCartas
  cartas: Carta[]
  sellados: Sellado[]
}

export interface Enlace {
  codigo: string | null
  vistos: string[]
  archivo: string[]
  ultima: string | null
}

export interface ItemBitacora {
  id: string
  clase: 'libro' | 'pelicula' | 'serie' | 'videojuego' | 'carta' | 'sellado' | 'incompleta'
  titulo: string
  detalle: string
  imagen: string | null
  datos: Record<string, unknown>
}

export const CAPACIDAD_CAJA = 25

interface Estado {
  dentro: boolean
  apuntado: string | null
  abierto: string | null
  guia: string | null
  terminal: boolean
  menuOrden: string | null
  pausa: boolean
  inicio: boolean
  llevoCarro: boolean
  editarPortada: string | null
  editorMapa: boolean
  cajaAbierta: string | null
  guardarEnCaja: string | null
  pokemon: Pokemon
  enlace: Enlace
  revision: ItemBitacora[]
  verRevision: boolean
  cuenta: { email: string } | null
  aviso: { texto: string; n: number } | null
  config: Config
  coleccion: Coleccion
}

export const MAX_CARRO = 20
// v2: la calidad por defecto pasa a media (la alta iba lenta en muchos equipos).
const CLAVE_CONFIG = 'bibliotec-config-v2'
const CLAVE_COLECCION = 'bibliotec-coleccion-v1'
const CLAVE_POKEMON = 'bibliotec-pokemon-v1'
const CLAVE_ENLACE = 'bibliotec-enlace-v1'

// Ejemplo: las graduadas van a la vitrina, unas comunes a una caja y el resto al expositor.
function pokemonInicial(): Pokemon {
  const sueltas = pokemonDemo.cartas.filter(c => !('graduada' in c))
  const comunes = sueltas.filter(c => /^(común|uncommon)$/i.test(c.rareza)).slice(0, 6).map(c => c.id)
  return {
    expositor: sueltas.map(c => c.id).filter(id => !comunes.includes(id)),
    cajas: [{ id: 'caja_1', nombre: 'kanto', cartas: comunes }, { id: 'caja_2', nombre: 'repetidas', cartas: [] }],
    criterio: 'set',
    cartas: [],
    sellados: [],
  }
}
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
  pausa: false,
  inicio: true,
  // Se empieza sin carro (aparcado junto a la mesa): se coge al necesitarlo.
  llevoCarro: false,
  editarPortada: null,
  editorMapa: false,
  cajaAbierta: null,
  guardarEnCaja: null,
  pokemon: leer<Pokemon>(CLAVE_POKEMON, pokemonInicial()),
  enlace: leer<Enlace>(CLAVE_ENLACE, { codigo: null, vistos: [], archivo: [], ultima: null }),
  revision: [],
  verRevision: false,
  cuenta: null,
  aviso: null,
  config: leer<Config>(CLAVE_CONFIG, { criterios: {}, extra: {}, guiaSuelo: true, sensibilidad: 1, calidad: 'media', calidadAuto: true, fov: 62, sonido: true, ejemplos: true }),
  coleccion: leer<Coleccion>(CLAVE_COLECCION, { anadidos: [], pendientes: PENDIENTES_INICIALES, carro: [], hoy: { fecha: hoyCivil(), n: 0 }, portadas: {}, expuestos: [] }),
}
const oyentes = new Set<() => void>()

export function cambiarEstado(parcial: Partial<Estado>) {
  const siguiente = { ...estado, ...parcial }
  if ((Object.keys(parcial) as (keyof Estado)[]).every(k => siguiente[k] === estado[k])) return
  if (siguiente.config !== estado.config) guardar(CLAVE_CONFIG, siguiente.config)
  if (siguiente.coleccion !== estado.coleccion) guardar(CLAVE_COLECCION, siguiente.coleccion)
  if (siguiente.pokemon !== estado.pokemon) guardar(CLAVE_POKEMON, siguiente.pokemon)
  if (siguiente.enlace !== estado.enlace) guardar(CLAVE_ENLACE, siguiente.enlace)
  estado = siguiente
  oyentes.forEach(o => o())
}

export function leerEstado() {
  return estado
}

export function suscribir(fn: () => void) {
  oyentes.add(fn)
  return () => { oyentes.delete(fn) }
}

// Lo que se guarda en la nube: todo lo que el usuario ha decidido, nada de lo
// que solo dura mientras juega.
export function datosGuardables() {
  return { config: estado.config, coleccion: estado.coleccion, pokemon: estado.pokemon, enlace: estado.enlace }
}

export function aplicarDatos(d: Partial<ReturnType<typeof datosGuardables>>) {
  cambiarEstado({
    ...(d.config ? { config: { ...estado.config, ...d.config } } : {}),
    ...(d.coleccion ? { coleccion: { ...estado.coleccion, ...d.coleccion } } : {}),
    ...(d.pokemon ? { pokemon: { ...estado.pokemon, ...d.pokemon } } : {}),
    ...(d.enlace ? { enlace: { ...estado.enlace, ...d.enlace } } : {}),
  })
}

export function quitarEjemplos() {
  const esEjemplo = (id: string) => id.startsWith('demo_')
  const p = estado.pokemon
  const propias = new Set(p.cartas.map(c => c.id))
  cambiarEstado({
    config: { ...estado.config, ejemplos: false },
    coleccion: { ...estado.coleccion, pendientes: estado.coleccion.pendientes.filter(id => !esEjemplo(id)), carro: estado.coleccion.carro.filter(id => !esEjemplo(id)) },
    pokemon: { ...p, expositor: p.expositor.filter(id => propias.has(id)), cajas: p.cajas.map(c => ({ ...c, cartas: c.cartas.filter(id => propias.has(id)) })) },
  })
}

export function cambiarCriterio(seccion: string, criterio: Criterio) {
  const c = estado.config
  cambiarEstado({ config: { ...c, criterios: { ...c.criterios, [seccion]: criterio } } })
}

export function sumarModulo(seccion: string) {
  const c = estado.config
  // Con el mapa hecho a mano, la estantería nueva se pone al lado de la
  // última de esa sección (se puede recolocar en el editor).
  if (c.mapa) {
    const suyas = c.mapa.muebles.filter(m => m.seccion === seccion)
    const ultima = suyas[suyas.length - 1]
    const nueva = ultima
      ? { ...ultima, id: 'm' + Date.now().toString(36), x: ultima.x + Math.cos(ultima.giro), z: ultima.z - Math.sin(ultima.giro) }
      : { id: 'm' + Date.now().toString(36), x: 0, z: 2.5, giro: 0, seccion, color: '#8a5a34', alto: 2.1, baldas: 5 }
    cambiarEstado({ config: { ...c, mapa: { muebles: [...c.mapa.muebles, nueva] } } })
    return
  }
  cambiarEstado({ config: { ...c, extra: { ...c.extra, [seccion]: (c.extra[seccion] ?? 0) + 1 } } })
}

export function cambiarAjuste<K extends keyof Config>(clave: K, valor: Config[K]) {
  cambiarEstado({ config: { ...estado.config, [clave]: valor } })
}

export function alternarExpuesto(id: string) {
  const c = estado.coleccion
  const expuestos = c.expuestos ?? []
  cambiarEstado({ coleccion: { ...c, expuestos: expuestos.includes(id) ? expuestos.filter(x => x !== id) : [...expuestos, id] } })
}

export function guardarMapa(muebles: MuebleMapa[] | null) {
  const { mapa: _, ...resto } = estado.config
  cambiarEstado({ config: muebles ? { ...resto, mapa: { muebles } } : resto })
}

export function ponerPortada(id: string, url: string | null) {
  const portadas = { ...estado.coleccion.portadas }
  if (url) portadas[id] = url; else delete portadas[id]
  cambiarEstado({ coleccion: { ...estado.coleccion, portadas } })
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

function cambiarPokemon(f: (p: Pokemon) => Partial<Pokemon>) {
  cambiarEstado({ pokemon: { ...estado.pokemon, ...f(estado.pokemon) } })
}

// Mueve una carta al expositor o a una caja (sin pasar de 25 por caja).
export function moverCarta(id: string, destino: 'expositor' | string): boolean {
  const p = estado.pokemon
  if (destino !== 'expositor') {
    const caja = p.cajas.find(c => c.id === destino)
    if (!caja || caja.cartas.length >= CAPACIDAD_CAJA) return false
  }
  cambiarPokemon(p => ({
    expositor: destino === 'expositor' ? [...p.expositor.filter(x => x !== id), id] : p.expositor.filter(x => x !== id),
    cajas: p.cajas.map(c => ({ ...c, cartas: c.id === destino ? [...c.cartas.filter(x => x !== id), id] : c.cartas.filter(x => x !== id) })),
  }))
  return true
}

export function crearCaja(nombre: string) {
  const id = 'caja_' + Date.now().toString(36)
  cambiarPokemon(p => ({ cajas: [...p.cajas, { id, nombre: nombre.trim().toLowerCase() || 'sin nombre', cartas: [] }] }))
  return id
}

export function renombrarCaja(id: string, nombre: string) {
  cambiarPokemon(p => ({ cajas: p.cajas.map(c => (c.id === id ? { ...c, nombre: nombre.trim().toLowerCase() || c.nombre } : c)) }))
}

export function cambiarCriterioCartas(criterio: CriterioCartas) {
  cambiarPokemon(() => ({ criterio }))
}

export function cambiarEnlace(parcial: Partial<Enlace>) {
  cambiarEstado({ enlace: { ...estado.enlace, ...parcial } })
}

export function anadirCarta(carta: Carta) {
  cambiarPokemon(p => ({
    cartas: [...p.cartas.filter(c => c.id !== carta.id), carta],
    expositor: carta.graduada || p.expositor.includes(carta.id) ? p.expositor : [...p.expositor, carta.id],
  }))
}

export function anadirSellado(s: Sellado) {
  cambiarPokemon(p => ({ sellados: [...p.sellados.filter(x => x.id !== s.id), s] }))
}

let numAviso = 0
export function avisar(texto: string) {
  cambiarEstado({ aviso: { texto, n: ++numAviso } })
}

// Muchos de golpe (importar de Libib): o a la mesa para ordenarlos a mano, o
// directos a su estantería. Los que ya estén (mismo título y tipo) se saltan.
export function anadirVarios(libros: Libro[], directo: boolean, existentes: Libro[]) {
  const clave = (l: Libro) => `${l.tipo}|${l.titulo.trim().toLowerCase()}`
  const ya = new Set(existentes.map(clave))
  const nuevos = libros.filter(l => !ya.has(clave(l)) && (ya.add(clave(l)), true))
  const c = estado.coleccion
  cambiarEstado({ coleccion: { ...c, anadidos: [...c.anadidos, ...nuevos], pendientes: directo ? c.pendientes : [...c.pendientes, ...nuevos.map(l => l.id)] } })
  return nuevos.length
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
