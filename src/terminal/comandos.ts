import type { Biblioteca } from '../escena/distribucion'
import { CRITERIOS } from '../libros/orden'
import type { Criterio, Hueco, Libro, Seccion } from '../tipos'

export interface Contexto {
  biblioteca: Biblioteca
  ultimaBusqueda: Libro[]
  ordenar: (seccion: string, criterio: Criterio) => void
  ampliar: (seccion: string) => void
  guiar: (id: string) => void
  salir: () => void
}

export interface Respuesta {
  lineas: string[]
  busqueda?: Libro[]
  limpiar?: boolean
}

const normal = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export const AYUDA = [
  'COMANDOS:',
  '  BUSCAR <TEXTO>       BUSCA POR TITULO, AUTOR O SAGA',
  '  IR <N | TEXTO>       TE MARCA EL CAMINO HASTA UN LIBRO',
  '  DONDE <N | TEXTO>    DONDE ESTA EN LA BIBLIOTECA Y EN CASA',
  '  ESTANTERIAS          LISTA DE ESTANTERIAS Y SU OCUPACION',
  '  ORDENAR <EST> POR <CRITERIO>',
  '                       CRITERIOS: ' + CRITERIOS.map(c => normal(c.nombre).toUpperCase()).join(', '),
  '                       <EST> PUEDE SER TODAS',
  '  AMPLIAR <EST>        AÑADE UN MUEBLE A UNA ESTANTERIA',
  '  ESTADISTICAS         CIFRAS DE TU COLECCION',
  '  PENDIENTES           LO QUE ESPERA EN LA ENTRADA',
  '  CREDITOS  LIMPIAR  SALIR',
]

function buscarSeccion(texto: string, secciones: Seccion[]) {
  const t = normal(texto)
  return secciones.find(s => normal(s.nombre) === t) ?? secciones.find(s => normal(s.nombre).startsWith(t)) ?? null
}

function buscarCriterio(texto: string) {
  const t = normal(texto)
  return CRITERIOS.find(c => normal(c.nombre) === t || c.id === t || normal(c.nombre).startsWith(t))?.id ?? null
}

function buscarLibros(texto: string, huecos: Hueco[]) {
  const t = normal(texto)
  return huecos
    .map(h => h.libro)
    .filter(l => [l.titulo, l.autor, l.saga ?? ''].some(c => normal(c).includes(t)))
}

function elegirLibro(arg: string, ctx: Contexto) {
  const n = Number(arg)
  if (Number.isInteger(n) && n > 0 && ctx.ultimaBusqueda[n - 1]) return ctx.ultimaBusqueda[n - 1]
  return buscarLibros(arg, ctx.biblioteca.huecos)[0] ?? null
}

function lugar(h: Hueco) {
  return `ESTANTERIA ${h.seccion.toUpperCase()}, MUEBLE ${h.modulo + 1}, BALDA ${h.balda} DESDE ARRIBA`
}

export function ejecutar(linea: string, ctx: Contexto): Respuesta {
  const [orden = '', ...resto] = linea.trim().split(/\s+/)
  const arg = resto.join(' ')
  const { biblioteca } = ctx
  switch (normal(orden)) {
    case '':
      return { lineas: [] }
    case 'ayuda': case '?': case 'help':
      return { lineas: AYUDA }
    case 'buscar': case 'b': {
      if (!arg) return { lineas: ['ESCRIBE QUE BUSCAS. EJEMPLO: BUSCAR TOLKIEN'] }
      const r = buscarLibros(arg, biblioteca.huecos)
      if (!r.length) return { lineas: [`NADA COINCIDE CON "${arg.toUpperCase()}".`, 'PRUEBA CON UNA PARTE DEL TITULO O DEL APELLIDO.'] }
      return {
        lineas: [
          `${r.length} ${r.length === 1 ? 'RESULTADO' : 'RESULTADOS'}:`,
          ...r.slice(0, 12).map((l, i) => `  ${String(i + 1).padStart(2)}. ${l.titulo.toUpperCase()} (${l.autor.toUpperCase()})`),
          ...(r.length > 12 ? [`  ... Y ${r.length - 12} MAS. AFINA LA BUSQUEDA.`] : []),
          'ESCRIBE IR <N> PARA QUE TE GUIE.',
        ],
        busqueda: r,
      }
    }
    case 'ir': case 'guiar': {
      const libro = arg ? elegirLibro(arg, ctx) : null
      if (!libro) return { lineas: ['NO SE QUE LIBRO. BUSCA PRIMERO Y ESCRIBE IR <N>.'] }
      ctx.guiar(libro.id)
      return { lineas: [`MARCADO: ${libro.titulo.toUpperCase()}.`, 'SIGUE LA LUZ. SALIENDO...'] }
    }
    case 'donde': {
      const libro = arg ? elegirLibro(arg, ctx) : null
      const h = libro && biblioteca.huecos.find(x => x.libro.id === libro.id)
      if (!libro || !h) return { lineas: ['NO LO ENCUENTRO EN LA BIBLIOTECA.'] }
      return { lineas: [libro.titulo.toUpperCase(), `  AQUI:    ${lugar(h)}`, `  EN CASA: ${(libro.ubicacion ?? 'SIN UBICACION DEFINIDA').toUpperCase()}`] }
    }
    case 'estanterias': case 'est': {
      return {
        lineas: [
          'ESTANTERIA          LIBROS  MUEBLES  ORDEN',
          ...biblioteca.secciones.map(s => `  ${s.nombre.toUpperCase().padEnd(18)}${String(s.libros.length).padStart(5)}${String(s.modulos).padStart(9)}  ${normal(CRITERIOS.find(c => c.id === s.criterio)!.nombre).toUpperCase()}`),
          `SITIO LIBRE PARA ${biblioteca.libres} MUEBLES MAS.`,
        ],
      }
    }
    case 'ordenar': {
      const m = normal(arg).match(/^(.+?)\s+por\s+(.+)$/)
      if (!m) return { lineas: ['USO: ORDENAR <ESTANTERIA> POR <CRITERIO>', 'EJEMPLO: ORDENAR FANTASIA POR COLOR'] }
      const criterio = buscarCriterio(m[2])
      if (!criterio) return { lineas: [`NO CONOZCO EL CRITERIO "${m[2].toUpperCase()}".`] }
      const todas = /^tod(a|o)s?$/.test(m[1])
      const objetivo = todas ? biblioteca.secciones : [buscarSeccion(m[1], biblioteca.secciones)].filter((s): s is Seccion => !!s)
      if (!objetivo.length) return { lineas: [`NO HAY ESTANTERIA "${m[1].toUpperCase()}". ESCRIBE ESTANTERIAS.`] }
      objetivo.forEach(s => ctx.ordenar(s.id, criterio))
      return { lineas: [`REORDENANDO ${todas ? 'TODAS LAS ESTANTERIAS' : objetivo[0].nombre.toUpperCase()} POR ${normal(CRITERIOS.find(c => c.id === criterio)!.nombre).toUpperCase()}... HECHO.`] }
    }
    case 'ampliar': {
      const s = arg ? buscarSeccion(arg, biblioteca.secciones) : null
      if (!s) return { lineas: ['USO: AMPLIAR <ESTANTERIA>. ESCRIBE ESTANTERIAS PARA VERLAS.'] }
      if (biblioteca.libres < 1) return { lineas: ['LA SALA ESTA LLENA. HARA FALTA UNA SALA NUEVA.'] }
      ctx.ampliar(s.id)
      return { lineas: [`MUEBLE NUEVO PARA ${s.nombre.toUpperCase()}. AHORA TIENE ${s.modulos + 1}.`] }
    }
    case 'estadisticas': case 'stats': {
      const libros = biblioteca.huecos.map(h => h.libro)
      const paginas = libros.reduce((s, l) => s + (l.paginas ?? 0), 0)
      const autores = new Set(libros.map(l => l.autor)).size
      const viejo = libros.filter(l => l.anio).sort((a, b) => a.anio! - b.anio!)[0]
      return {
        lineas: [
          `LIBROS ............ ${libros.length}`,
          `PAGINAS ........... ${paginas.toLocaleString('es-ES')}`,
          `AUTORES ........... ${autores}`,
          `ESTANTERIAS ....... ${biblioteca.secciones.length}`,
          ...(viejo ? [`EL MAS ANTIGUO .... ${viejo.titulo.toUpperCase()} (${viejo.anio})`] : []),
          ...biblioteca.secciones.map(s => `  ${s.nombre.toUpperCase().padEnd(17)} ${'#'.repeat(Math.ceil(s.libros.length / 2))} ${s.libros.length}`),
        ],
      }
    }
    case 'pendientes':
      return { lineas: ['NADA POR ORDENAR EN LA ENTRADA.', '(LA ENTRADA Y EL CARRO LLEGAN EN LA FASE 3.)'] }
    case 'creditos':
      return { lineas: ['BIBLIOTEC SE APOYA EN:', '  THREE.JS, REACT THREE FIBER, DREI (MIT)', '  OPEN LIBRARY (PORTADAS Y DATOS)', '  POPPINS Y VT323 (OFL)', 'LISTA COMPLETA EN CREDITOS.MD'] }
    case 'limpiar': case 'cls': case 'clear':
      return { lineas: [], limpiar: true }
    case 'salir': case 'exit': case 'q':
      ctx.salir()
      return { lineas: ['HASTA LUEGO.'] }
    case 'hola':
      return { lineas: ['HOLA. LLEVO AQUI DESDE 1984 ESPERANDO A QUE ALGUIEN ORDENE ESTO.'] }
    case '42':
      return { lineas: ['LA RESPUESTA ES CORRECTA. LA PREGUNTA SIGUE SIN APARECER.'] }
    default:
      return { lineas: [`"${orden.toUpperCase()}" NO ES UN COMANDO. ESCRIBE AYUDA.`] }
  }
}
