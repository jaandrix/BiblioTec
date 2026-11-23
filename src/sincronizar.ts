import { aplicarDatos, avisar, cambiarEnlace, cambiarEstado, datosGuardables, leerEstado, suscribir, type ItemBitacora } from './estado'
import { BITACORA_FUNCION, sb } from './nube'
import type { Carta, FormatoSellado, Libro, Sellado } from './tipos'

// ------------------------------------------------------------------ nube
// Una fila por usuario. Al entrar manda la nube (salvo que esté vacía: entonces
// se sube lo que hubiera en este navegador). Después, cada cambio se guarda a
// los 1,5 s, sin pisar con datos que acaban de llegar de la nube.

let ultimoGuardado = ''
let temporizador: ReturnType<typeof setTimeout> | null = null
let usuario: string | null = null

async function cargarDeLaNube(id: string) {
  const { data, error } = await sb.from('biblioteca').select('datos').eq('user_id', id).maybeSingle()
  if (error) { avisar('no se ha podido leer tu biblioteca de la nube.'); return }
  const datos = data?.datos as Partial<ReturnType<typeof datosGuardables>> | undefined
  if (datos && Object.keys(datos).length) {
    ultimoGuardado = JSON.stringify({ ...datosGuardables(), ...datos })
    aplicarDatos(datos)
  } else {
    await guardarEnLaNube()
  }
}

async function guardarEnLaNube() {
  if (!usuario) return
  const datos = datosGuardables()
  const texto = JSON.stringify(datos)
  if (texto === ultimoGuardado) return
  const { error } = await sb.from('biblioteca').upsert({ user_id: usuario, datos, actualizado: new Date().toISOString() })
  if (error) { console.error(error); return }
  ultimoGuardado = texto
}

suscribir(() => {
  if (!usuario) return
  if (JSON.stringify(datosGuardables()) === ultimoGuardado) return
  if (temporizador) clearTimeout(temporizador)
  temporizador = setTimeout(guardarEnLaNube, 1500)
})

async function alCambiarSesion(id: string | null, email: string | null) {
  if (id === usuario) return
  usuario = id
  cambiarEstado({ cuenta: id && email ? { email } : null })
  if (id) {
    await cargarDeLaNube(id)
    if (leerEstado().enlace.codigo) traerDeBitacora(true)
  }
}

export function arrancarNube() {
  sb.auth.getSession().then(({ data }) => alCambiarSesion(data.session?.user.id ?? null, data.session?.user.email ?? null))
  sb.auth.onAuthStateChange((evento, sesion) => {
    if (evento === 'PASSWORD_RECOVERY') cambiarEstado({ aviso: { texto: 'escribe tu contraseña nueva en el formulario.', n: Date.now() } })
    alCambiarSesion(sesion?.user.id ?? null, sesion?.user.email ?? null)
  })
  window.addEventListener('beforeunload', () => { if (temporizador) guardarEnLaNube() })
}

const volver = () => window.location.origin + window.location.pathname

export async function entrarConCorreo(email: string, clave: string) {
  const { error } = await sb.auth.signInWithPassword({ email, password: clave })
  return error ? (/confirm/i.test(error.message) ? 'confirma primero tu correo (mira la bandeja de entrada).' : 'correo o contraseña incorrectos.') : null
}

export async function crearCuenta(email: string, clave: string) {
  if (clave.length < 8) return 'la contraseña necesita al menos 8 caracteres.'
  const { error } = await sb.auth.signUp({ email, password: clave, options: { emailRedirectTo: volver() } })
  return error ? 'no se ha podido crear la cuenta: ' + error.message.toLowerCase() : null
}

export async function recordarClave(email: string) {
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: volver() })
  return error ? 'no se ha podido enviar el correo.' : null
}

export async function cambiarClave(clave: string) {
  const { error } = await sb.auth.updateUser({ password: clave })
  return error ? 'no se ha podido cambiar la contraseña.' : null
}

export async function salirDeLaCuenta() {
  await guardarEnLaNube()
  await sb.auth.signOut()
}

// ------------------------------------------------------------- bitácora
// Lee Ocio y Coleccionables con el código de solo lectura que se genera en
// Bitácora. Lo nuevo no entra directo: pasa por la revisión «¿lo tienes en
// físico?» (decisiones 31 a 33). Películas, series y juegos esperan a la fase
// Desde la fase 6 entran también películas, series y videojuegos (los de Ocio
// y los de Coleccionables, que son la colección física de juegos).

interface OcioBitacora { id: string; tipo: string; titulo: string; autor: string | null; anio: number | null; portada: string | null; etiquetas?: string[] }
interface ColecBitacora { id: string; nombre: string; categoria?: string; esCarta: boolean; carta: { set?: string; numero?: string; anio?: number; estado?: string } | null; mercadoId: string | null }

export function formatoDeSellado(nombre: string): FormatoSellado {
  const n = nombre.toLowerCase()
  if (/elite|entrenador élite|etb/.test(n)) return 'etb'
  if (/half|media/.test(n)) return 'media-caja'
  if (/booster box|caja de sobres|display/.test(n)) return 'caja'
  if (/tin|lata/.test(n)) return 'lata'
  if (/collection|colección|file|set\b|premium|box/.test(n)) return 'coleccion'
  return 'sobre'
}

export async function traerDeBitacora(silencioso = false) {
  const codigo = leerEstado().enlace.codigo
  if (!codigo) { if (!silencioso) avisar('falta el código de bitácora.'); return }
  let r: Response
  try {
    r = await fetch(BITACORA_FUNCION, { headers: { 'x-bibliotec': codigo } })
  } catch {
    if (!silencioso) avisar('sin conexión con bitácora.')
    return
  }
  if (r.status === 401) { avisar('el código de bitácora no vale o se ha cambiado.'); return }
  if (!r.ok) { avisar('bitácora no responde ahora.'); return }
  const { ocio = [], coleccionables = [] } = await r.json() as { ocio: OcioBitacora[]; coleccionables: ColecBitacora[] }
  const { vistos } = leerEstado().enlace
  const nuevos: ItemBitacora[] = []
  for (const o of ocio) {
    if (vistos.includes('o_' + o.id) || !['libro', 'pelicula', 'serie', 'videojuego'].includes(o.tipo)) continue
    const detalle = o.tipo === 'libro' ? o.autor ?? '' : o.tipo === 'videojuego' ? (o.etiquetas ?? []).join(', ') : o.anio ? String(o.anio) : ''
    nuevos.push({ id: 'o_' + o.id, clase: o.tipo as ItemBitacora['clase'], titulo: o.titulo, detalle, imagen: o.portada, datos: { ...o } })
  }
  for (const c of coleccionables) {
    if (vistos.includes('c_' + c.id)) continue
    if (!c.esCarta) {
      if (/videojuego|juego|game/i.test(c.categoria ?? '')) nuevos.push({ id: 'c_' + c.id, clase: 'videojuego', titulo: c.nombre.replace(/\s*\((box|loose|jp)\)/gi, ''), detalle: /\(loose\)/i.test(c.nombre) ? 'cartucho suelto' : 'con caja', imagen: null, datos: { ...c, coleccionable: true } })
      continue
    }
    const sellado = c.carta?.estado === 'Sellado'
    const clase = sellado ? 'sellado' : c.mercadoId ? 'carta' : 'incompleta'
    nuevos.push({
      id: 'c_' + c.id,
      clase,
      titulo: c.nombre,
      detalle: sellado ? 'producto sellado' : c.mercadoId ? [c.carta?.set, c.carta?.numero].filter(Boolean).join(' ') || 'carta' : 'falta elegir la carta exacta en bitácora (set y número).',
      imagen: c.mercadoId ? null : null,
      datos: { ...c },
    })
  }
  cambiarEnlace({ ultima: new Date().toISOString() })
  cambiarEstado({ revision: nuevos })
  if (nuevos.length) avisar(`${nuevos.length} ${nuevos.length === 1 ? 'cosa nueva' : 'cosas nuevas'} de bitácora. pulsa n para revisarlas.`)
  else if (!silencioso) avisar('todo al día con bitácora.')
}

const GENEROS: [RegExp, string][] = [
  [/fantasy|fantas/i, 'fantasía'],
  [/science fiction|ciencia ficci|sci-fi|dystopi/i, 'ciencia ficción'],
  [/history|essays|philosophy|biograph|nonfiction|non-fiction|ensayo|psycholog|politic/i, 'ensayo'],
  [/classic|clásic/i, 'clásicos'],
]

// Un libro de Bitácora trae título y autor; Open Library pone páginas, año,
// género y, si falta, portada.
export async function libroDesdeBitacora(item: ItemBitacora): Promise<Libro> {
  const o = item.datos as unknown as OcioBitacora
  let extra: Partial<Libro> = {}
  try {
    const campos = { fields: 'key,first_publish_year,number_of_pages_median,cover_i,subject,author_name', limit: '1', lang: 'es' }
    const buscar = async (p: Record<string, string>) => (await (await fetch(`https://openlibrary.org/search.json?${new URLSearchParams({ ...p, ...campos })}`)).json()).docs?.[0]
    // Por título exacto falla con las traducciones («El nombre del viento» es
    // «The Name of the Wind» en Open Library): entonces, búsqueda libre.
    const d = await buscar({ title: o.titulo, ...(o.autor ? { author: o.autor } : {}) }) ?? await buscar({ q: [o.titulo, o.autor].filter(Boolean).join(' ') })
    if (d) {
      const temas = (d.subject ?? []).slice(0, 40).join(' | ')
      extra = {
        anio: d.first_publish_year ?? null,
        paginas: d.number_of_pages_median ?? null,
        portada: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
        genero: GENEROS.find(([re]) => re.test(temas))?.[1] ?? 'novela',
        autor: d.author_name?.[0],
      }
    }
  } catch { /* sin Open Library: se queda con lo de Bitácora */ }
  return {
    id: 'bit_' + o.id,
    tipo: 'libro',
    titulo: o.titulo,
    autor: o.autor || extra.autor || 'autor desconocido',
    anio: o.anio ?? extra.anio ?? null,
    paginas: extra.paginas ?? null,
    portada: o.portada || extra.portada || null,
    genero: extra.genero ?? 'novela',
    alta: new Date().toLocaleDateString('sv-SE'),
  }
}

export async function cartaDesdeBitacora(item: ItemBitacora): Promise<Carta | null> {
  const c = item.datos as unknown as ColecBitacora
  if (!c.mercadoId) return null
  const pedir = async (idioma: string) => { const r = await fetch(`https://api.tcgdex.net/v2/${idioma}/cards/${encodeURIComponent(c.mercadoId!)}`); return r.ok ? r.json() : null }
  const d = await pedir('es').catch(() => null) ?? await pedir('en').catch(() => null)
  if (!d?.image) return null
  const psa = String(c.carta?.numero ?? '').match(/^(PSA|BGS|CGC|BECKETT)\s*(\d+(\.\d)?)$/i)
  return {
    id: 'carta_' + d.id,
    tipo: 'carta',
    tcgdex: d.id,
    nombre: d.name,
    set: d.set?.name ?? c.carta?.set ?? '',
    setId: d.set?.id ?? '',
    numero: d.localId,
    total: d.set?.cardCount?.official ?? null,
    rareza: d.rarity ?? '',
    imagen: d.image,
    holo: !/^(común|poco común|uncommon|common)$/i.test(d.rarity ?? ''),
    estado: c.carta?.estado ?? 'Near Mint',
    ...(psa ? { graduada: { empresa: psa[1].toUpperCase(), nota: Number(psa[2]) } } : {}),
  }
}

// Plataforma por la etiqueta de Ocio o, en los coleccionables, por el
// nombre: la colección física suele ser de DS y 3DS.
const PLATAFORMAS: [RegExp, string][] = [
  [/switch/i, 'switch'],
  [/\b3ds\b|new leaf|pok[eé]mon (x|y|sol|luna|rub[ií] omega|zafiro alfa|super mystery)|yo-?kai|inazuma eleven go|dragon quest vii/i, '3ds'],
  [/\bds\b|heartgold|soulsilver|platin|blanco|black|white|negro|ranger|mystery dungeon|rescue team|inazuma eleven 3/i, 'ds'],
  [/ps5|ps4|playstation/i, 'ps'],
  [/xbox/i, 'xbox'],
]

export function medioDesdeBitacora(item: ItemBitacora): Libro {
  const d = item.datos as unknown as OcioBitacora & ColecBitacora & { coleccionable?: boolean }
  const tipo = item.clase as Libro['tipo']
  const pista = [d.titulo ?? d.nombre, ...(d.etiquetas ?? [])].join(' ')
  const plataforma = tipo === 'videojuego' ? PLATAFORMAS.find(([re]) => re.test(pista))?.[1] ?? 'otra' : undefined
  const suelto = /\(loose\)/i.test(d.nombre ?? '')
  return {
    id: 'bit_' + item.id,
    tipo,
    titulo: item.titulo,
    autor: '',
    anio: d.anio ?? null,
    paginas: null,
    portada: d.portada ?? null,
    formato: tipo === 'videojuego' ? (suelto ? 'cartucho' : 'caja') : 'dvd',
    ...(plataforma ? { plataforma } : {}),
    alta: new Date().toLocaleDateString('sv-SE'),
  }
}

export function selladoDesdeBitacora(item: ItemBitacora): Sellado {
  const c = item.datos as unknown as ColecBitacora
  return { id: 'sellado_bit_' + c.id, tipo: 'sellado', formato: formatoDeSellado(c.nombre), nombre: c.nombre, set: c.nombre, setId: '', logo: null, simbolo: null }
}
