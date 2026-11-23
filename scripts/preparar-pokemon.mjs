// Genera src/datos/pokemon-demo.json desde TCGdex: cartas y producto sellado de
// ejemplo para la fase 4, mientras no existe el enlace con Bitácora.
import { writeFile } from 'node:fs/promises'

const API = 'https://api.tcgdex.net/v2'
const CARTAS = [
  'sv03.5-001', 'sv03.5-004', 'sv03.5-006', 'sv03.5-007', 'sv03.5-025', 'sv03.5-052', 'sv03.5-054',
  'sv03.5-094', 'sv03.5-129', 'sv03.5-130', 'sv03.5-143', 'sv03.5-147', 'sv03.5-149', 'sv03.5-150',
  'sv03.5-151', 'sv03.5-173', 'sv03.5-199', 'sv03.5-205', 'swsh7-215', 'swsh7-095', 'swsh11-131',
  'swsh12.5-GG44', 'sv08-238', 'sv08.5-161', 'sv02-254', 'sv04.5-232',
]
const GRADUADAS = { 'swsh11-131': { empresa: 'PSA', nota: 10 } }
const SELLADOS = [
  { formato: 'etb', set: 'sv03.5' },
  { formato: 'media-caja', set: 'sv08' },
  { formato: 'media-caja', set: 'sv09' },
  { formato: 'caja', set: 'sv06' },
  { formato: 'sobre', set: 'sv08.5' },
  { formato: 'sobre', set: 'sv08.5' },
  { formato: 'sobre', set: 'sv03.5' },
  { formato: 'lata', set: 'swsh12.5' },
  { formato: 'coleccion', set: 'sv04.5' },
]
const NOMBRES_FORMATO = { etb: 'Caja de Entrenador Élite', 'media-caja': 'Media caja de sobres', caja: 'Caja de sobres', sobre: 'Sobre', lata: 'Lata', coleccion: 'Colección especial' }

async function pedir(ruta) {
  for (const idioma of ['es', 'en']) {
    const r = await fetch(`${API}/${idioma}${ruta}`)
    if (r.ok) return { ...(await r.json()), idioma }
  }
  return null
}

const cartas = []
for (const id of CARTAS) {
  const c = await pedir(`/cards/${id}`)
  if (!c || !c.image) { console.warn('sin carta:', id); continue }
  cartas.push({
    id: 'carta_' + id,
    tipo: 'carta',
    tcgdex: id,
    nombre: c.name,
    set: c.set?.name ?? '',
    setId: c.set?.id ?? id.split('-')[0],
    numero: c.localId,
    total: c.set?.cardCount?.official ?? null,
    rareza: c.rarity ?? '',
    imagen: c.image,
    holo: !/^(común|poco común|uncommon|common)$/i.test(c.rarity ?? ''),
    estado: 'Near Mint',
    ...(GRADUADAS[id] ? { graduada: GRADUADAS[id] } : {}),
  })
  console.log('ok', c.name)
}

const sellados = []
for (const [i, s] of SELLADOS.entries()) {
  const set = await pedir(`/sets/${s.set}`)
  if (!set) { console.warn('sin set:', s.set); continue }
  sellados.push({
    id: `sellado_${s.set}_${s.formato}_${i}`,
    tipo: 'sellado',
    formato: s.formato,
    nombre: `${NOMBRES_FORMATO[s.formato]} ${set.name}`,
    set: set.name,
    setId: s.set,
    logo: set.logo ? `${set.logo}.png` : null,
    simbolo: set.symbol ? `${set.symbol}.png` : null,
  })
  console.log('ok', set.name, s.formato)
}

await writeFile(new URL('../src/datos/pokemon-demo.json', import.meta.url), JSON.stringify({ cartas, sellados }, null, 2) + '\n')
console.log(cartas.length, 'cartas,', sellados.length, 'sellados')
