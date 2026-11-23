import type { Biblioteca } from '../escena/distribucion'
import { CRITERIOS } from '../libros/orden'
import type { CajaCartas, Carta, Criterio, Hueco, Libro, Seccion } from '../tipos'

export interface Contexto {
  biblioteca: Biblioteca
  pendientes: Libro[]
  carro: Libro[]
  ultimaBusqueda: Libro[]
  candidatos: Libro[]
  anadir: (libro: Libro) => void
  colocarTodo: () => void
  cartas: Carta[]
  cajas: CajaCartas[]
  crearCaja: (nombre: string) => void
  precio: (tcgdex: string) => Promise<number | null>
  ordenar: (seccion: string, criterio: Criterio) => void
  ampliar: (seccion: string) => void
  guiar: (id: string) => void
  salir: () => void
}

export interface Respuesta {
  lineas: string[]
  busqueda?: Libro[]
  candidatos?: Libro[]
  limpiar?: boolean
  despues?: Promise<Respuesta>
}

const GENEROS: [RegExp, string][] = [
  [/fantasy|fantas/i, 'fantasía'],
  [/science fiction|ciencia ficci|sci-fi|dystopi/i, 'ciencia ficción'],
  [/history|essays|philosophy|biograph|nonfiction|non-fiction|ensayo|science|psycholog|politic/i, 'ensayo'],
  [/classic|clásic/i, 'clásicos'],
]

function generoDe(temas: string[] = []) {
  const texto = temas.slice(0, 40).join(' | ')
  return GENEROS.find(([re]) => re.test(texto))?.[1] ?? 'novela'
}

async function buscarEnOpenLibrary(texto: string): Promise<Libro[]> {
  const campos = 'key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject'
  const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(texto)}&lang=es&fields=${campos}&limit=6`)
  if (!r.ok) throw new Error(String(r.status))
  const { docs = [] } = await r.json()
  return docs.map((d: { key: string; title: string; author_name?: string[]; first_publish_year?: number; number_of_pages_median?: number; cover_i?: number; subject?: string[] }) => ({
    id: 'ol_' + d.key.split('/').pop(),
    tipo: 'libro' as const,
    titulo: d.title,
    autor: d.author_name?.[0] ?? 'autor desconocido',
    anio: d.first_publish_year ?? null,
    paginas: d.number_of_pages_median ?? null,
    portada: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
    genero: generoDe(d.subject),
    alta: new Date().toLocaleDateString('sv-SE'),
  }))
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
  '  PENDIENTES           LO QUE ESPERA EN LA ENTRADA Y EN EL CARRO',
  '  AÑADIR <TITULO>      BUSCA UN LIBRO EN OPEN LIBRARY',
  '  ELEGIR <N>           LO DEJA EN LA MESA DE LA ENTRADA',
  '  COLOCAR TODO         COLOCA SOLO LO PENDIENTE Y EL CARRO',
  '  CARTAS               RESUMEN DE TU COLECCION POKEMON',
  '  CAJAS                CAJAS DE CARTAS Y SU OCUPACION',
  '  CAJA NUEVA <NOMBRE>  CREA UNA CAJA NEGRA (25 CARTAS)',
  '  VALOR                VALOR DE MERCADO DE TUS CARTAS',
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
    case 'pendientes': {
      if (!ctx.pendientes.length && !ctx.carro.length) return { lineas: ['TODO ESTA EN SU SITIO.'] }
      return {
        lineas: [
          `EN LA MESA (${ctx.pendientes.length}):`,
          ...ctx.pendientes.map(l => `  - ${l.titulo.toUpperCase()}`),
          `EN EL CARRO (${ctx.carro.length}):`,
          ...ctx.carro.map(l => `  - ${l.titulo.toUpperCase()}`),
        ],
      }
    }
    case 'anadir': case 'añadir': {
      if (!arg) return { lineas: ['USO: AÑADIR <TITULO O AUTOR>'] }
      return {
        lineas: [`BUSCANDO "${arg.toUpperCase()}" EN OPEN LIBRARY...`],
        despues: buscarEnOpenLibrary(arg).then(r => r.length
          ? {
              lineas: [
                ...r.map((l, i) => `  ${i + 1}. ${l.titulo.toUpperCase()} (${l.autor.toUpperCase()}${l.anio ? ', ' + l.anio : ''})  [${l.genero!.toUpperCase()}]`),
                'ESCRIBE ELEGIR <N> PARA DEJARLO EN LA MESA DE LA ENTRADA.',
              ],
              candidatos: r,
            }
          : { lineas: ['NO HE ENCONTRADO NADA. PRUEBA CON OTRAS PALABRAS.'] })
          .catch(() => ({ lineas: ['SIN CONEXION CON OPEN LIBRARY. PRUEBA MAS TARDE.'] })),
      }
    }
    case 'elegir': {
      const libro = ctx.candidatos[Number(arg) - 1]
      if (!libro) return { lineas: ['PRIMERO AÑADIR <TITULO> Y LUEGO ELEGIR <N>.'] }
      const ya = ctx.biblioteca.huecos.some(h => h.libro.id === libro.id) || ctx.pendientes.some(l => l.id === libro.id)
      if (ya) return { lineas: ['ESE LIBRO YA ESTA EN TU BIBLIOTECA.'] }
      ctx.anadir(libro)
      return { lineas: [`${libro.titulo.toUpperCase()} TE ESPERA EN LA MESA DE LA ENTRADA.`] }
    }
    case 'colocar': {
      const n = ctx.pendientes.length + ctx.carro.length
      if (!n) return { lineas: ['NO HAY NADA POR COLOCAR.'] }
      ctx.colocarTodo()
      return { lineas: [`COLOCANDO ${n} ${n === 1 ? 'LIBRO' : 'LIBROS'} EN SU SITIO... HECHO.`] }
    }
    case 'cartas': {
      const holo = ctx.cartas.filter(c => c.holo).length
      const sets = new Set(ctx.cartas.map(c => c.set)).size
      return { lineas: [`CARTAS ............ ${ctx.cartas.length}`, `BRILLANTES ........ ${holo}`, `GRADUADAS ......... ${ctx.cartas.filter(c => c.graduada).length}`, `SETS .............. ${sets}`] }
    }
    case 'cajas':
      return { lineas: ctx.cajas.length ? ctx.cajas.map(c => `  ${c.nombre.toUpperCase().padEnd(18)} ${String(c.cartas.length).padStart(2)} / 25`) : ['NO HAY CAJAS. CAJA NUEVA <NOMBRE>.'] }
    case 'caja': {
      const m = arg.match(/^nueva\s+(.+)$/i)
      if (!m) return { lineas: ['USO: CAJA NUEVA <NOMBRE>'] }
      ctx.crearCaja(m[1])
      return { lineas: [`CAJA ${m[1].toUpperCase()} LISTA EN LA BALDA DE ABAJO DEL EXPOSITOR.`] }
    }
    case 'valor':
      return {
        lineas: [`CONSULTANDO CARDMARKET PARA ${ctx.cartas.length} CARTAS...`],
        despues: Promise.all(ctx.cartas.map(c => ctx.precio(c.tcgdex).then(p => ({ c, p })))).then(r => {
          const con = r.filter(x => x.p != null) as { c: Carta; p: number }[]
          const total = con.reduce((s, x) => s + x.p, 0)
          const top = [...con].sort((a, b) => b.p - a.p).slice(0, 3)
          return {
            lineas: [
              `VALOR TOTAL ....... ${total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`,
              `SIN PRECIO ........ ${r.length - con.length}`,
              'LAS MAS VALIOSAS:',
              ...top.map(x => `  ${x.c.nombre.toUpperCase().padEnd(22)} ${x.p.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`),
              '(PRECIO MEDIO DE CARDMARKET VIA TCGDEX)',
            ],
          }
        }),
      }
    case 'creditos':
      return { lineas: ['BIBLIOTEC SE APOYA EN:', '  THREE.JS, REACT THREE FIBER, DREI (MIT)', '  OPEN LIBRARY (PORTADAS Y DATOS)',
  '  TCGDEX (CARTAS POKEMON Y PRECIOS)', '  POPPINS Y VT323 (OFL)', 'LISTA COMPLETA EN CREDITOS.MD'] }
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
