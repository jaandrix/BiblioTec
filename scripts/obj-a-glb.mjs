// Convierte modelos OBJ + MTL de colores planos (como los kits de Kenney) en
// GLB de una sola malla con el color en cada vértice: una llamada de dibujo
// por modelo y ninguna textura.
//
// Uso: node scripts/obj-a-glb.mjs <carpeta con los .obj> <carpeta de salida> nombre:alto[:salida] ...
// El alto, en metros, fija la escala; el modelo queda centrado y apoyado en y = 0.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [origen, destino, ...piezas] = process.argv.slice(2)
if (!origen || !destino || !piezas.length) {
  console.error('uso: node scripts/obj-a-glb.mjs <origen> <destino> nombre:alto[:salida] ...')
  process.exit(1)
}

// Los colores del MTL están en sRGB; glTF guarda los de vértice en lineal.
const lineal = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

function leerMtl(ruta) {
  const colores = {}
  let actual = null
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const p = linea.trim().split(/\s+/)
    if (p[0] === 'newmtl') actual = p[1]
    if (p[0] === 'Kd' && actual) colores[actual] = p.slice(1, 4).map(Number).map(lineal)
  }
  return colores
}

function convertir(nombre, alto) {
  const texto = readFileSync(join(origen, `${nombre}.obj`), 'utf8')
  const mtl = texto.match(/^mtllib\s+(.+)$/m)?.[1].trim()
  const colores = mtl ? leerMtl(join(origen, mtl)) : {}
  const v = [], vn = [], pos = [], nor = [], col = []
  let color = [0.8, 0.8, 0.8]
  for (const linea of texto.split(/\r?\n/)) {
    const p = linea.trim().split(/\s+/)
    if (p[0] === 'v') v.push(p.slice(1, 4).map(Number))
    else if (p[0] === 'vn') vn.push(p.slice(1, 4).map(Number))
    else if (p[0] === 'usemtl') color = colores[p[1]] ?? [0.8, 0.8, 0.8]
    else if (p[0] === 'f') {
      const esquinas = p.slice(1).map(e => e.split('/').map(n => (n ? Number(n) : 0)))
      for (let i = 1; i < esquinas.length - 1; i++) {
        for (const e of [esquinas[0], esquinas[i], esquinas[i + 1]]) {
          pos.push(...v[(e[0] > 0 ? e[0] : v.length + e[0] + 1) - 1])
          nor.push(...(e[2] ? vn[(e[2] > 0 ? e[2] : vn.length + e[2] + 1) - 1] : [0, 1, 0]))
          col.push(...color)
        }
      }
    }
  }
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], pos[i + k]); max[k] = Math.max(max[k], pos[i + k]) }
  const escala = alto / (max[1] - min[1])
  const centro = [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2]
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) pos[i + k] = (pos[i + k] - centro[k]) * escala
  for (let k = 0; k < 3; k++) { min[k] = (min[k] - centro[k]) * escala; max[k] = (max[k] - centro[k]) * escala }
  return { pos, nor, col, min, max }
}

function glb({ pos, nor, col, min, max }) {
  const n = pos.length / 3
  const bloques = [new Float32Array(pos), new Float32Array(nor), new Float32Array(col)]
  const bin = Buffer.concat(bloques.map(b => Buffer.from(b.buffer)))
  const largo = n * 12
  const json = {
    asset: { version: '2.0', generator: 'bibliotec obj-a-glb' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.8 } }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [0, 1, 2].map(i => ({ buffer: 0, byteOffset: i * largo, byteLength: largo, target: 34962 })),
    accessors: [
      { bufferView: 0, componentType: 5126, count: n, type: 'VEC3', min, max },
      { bufferView: 1, componentType: 5126, count: n, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: n, type: 'VEC3' },
    ],
  }
  let cabecera = Buffer.from(JSON.stringify(json))
  cabecera = Buffer.concat([cabecera, Buffer.alloc((4 - (cabecera.length % 4)) % 4, 0x20)])
  const datos = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)])
  const total = 12 + 8 + cabecera.length + 8 + datos.length
  const h = Buffer.alloc(12)
  h.writeUInt32LE(0x46546c67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(total, 8)
  const c1 = Buffer.alloc(8); c1.writeUInt32LE(cabecera.length, 0); c1.writeUInt32LE(0x4e4f534a, 4)
  const c2 = Buffer.alloc(8); c2.writeUInt32LE(datos.length, 0); c2.writeUInt32LE(0x004e4942, 4)
  return Buffer.concat([h, c1, cabecera, c2, datos])
}

for (const pieza of piezas) {
  const [nombre, alto, salida] = pieza.split(':')
  const modelo = convertir(nombre, Number(alto))
  const archivo = join(destino, `${salida ?? nombre}.glb`)
  writeFileSync(archivo, glb(modelo))
  const medidas = modelo.max.map((m, k) => (m - modelo.min[k]).toFixed(2)).join(' x ')
  console.log(`${archivo}: ${modelo.pos.length / 9} triángulos, ${medidas} m`)
}
