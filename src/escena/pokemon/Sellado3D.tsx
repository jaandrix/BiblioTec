import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { BoxGeometry, CanvasTexture, Group, MeshStandardMaterial, Quaternion, SRGBColorSpace, Vector3 } from 'three'
import { useEstado } from '../../estado'
import { colorDominante } from '../../libros/color'
import type { FormatoSellado, Sellado } from '../../tipos'
import { useInspeccion } from '../inspeccion'
import { mallasLibros } from '../registro'

// Medidas aproximadas en metros (ancho, alto, fondo), de pie y de frente.
// Se afinarán con los datos de DeepSeek.
export const MEDIDAS_SELLADO: Record<FormatoSellado, [number, number, number]> = {
  etb: [0.24, 0.17, 0.11],
  caja: [0.22, 0.14, 0.075],
  'media-caja': [0.14, 0.14, 0.075],
  sobre: [0.075, 0.13, 0.008],
  lata: [0.18, 0.13, 0.07],
  coleccion: [0.27, 0.2, 0.06],
}
const ETIQUETA: Record<FormatoSellado, string> = {
  etb: 'caja de entrenador élite', caja: 'caja de 36 sobres', 'media-caja': 'caja de 18 sobres',
  sobre: 'sobre de mejora', lata: 'lata de colección', coleccion: 'colección especial',
}
const FRENTE = new Quaternion()

function aclarar(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16)
  return '#' + [16, 8, 0].map(s => Math.min(255, Math.round(((n >> s) & 255) * (1 - k) + 255 * k)).toString(16).padStart(2, '0')).join('')
}

// Frente de la caja estilo videojuego: degradado con el color del set, su logo
// oficial (de TCGdex) y una banda con el formato. Reconocible sin copiar el
// diseño real de cada producto.
function pintarFrente(s: Sellado, color: string, logo: HTMLImageElement | null) {
  const [w, h] = MEDIDAS_SELLADO[s.formato]
  const l = document.createElement('canvas')
  // Los últimos 16 px son el color de los costados (ver cajaConFrente).
  l.width = 512 + 16
  l.height = Math.round((512 * h) / w)
  const c = l.getContext('2d')!
  c.fillStyle = color
  c.fillRect(512, 0, 16, l.height)
  c.save()
  c.beginPath()
  c.rect(0, 0, 512, l.height)
  c.clip()
  const g = c.createLinearGradient(0, 0, 0, l.height)
  g.addColorStop(0, aclarar(color, 0.35))
  g.addColorStop(1, color)
  c.fillStyle = g
  c.fillRect(0, 0, 512, l.height)
  c.fillStyle = 'rgba(255,255,255,0.12)'
  for (let i = -l.height; i < 512; i += 46) {
    c.beginPath(); c.moveTo(i, l.height); c.lineTo(i + l.height, 0); c.lineTo(i + l.height + 18, 0); c.lineTo(i + 18, l.height); c.fill()
  }
  if (logo) {
    const max = 512 * 0.78, alto = l.height * 0.5
    const k = Math.min(max / logo.width, alto / logo.height)
    c.drawImage(logo, (512 - logo.width * k) / 2, l.height * 0.38 - (logo.height * k) / 2, logo.width * k, logo.height * k)
  } else {
    c.fillStyle = '#fff'
    c.font = '600 44px Poppins, sans-serif'
    c.textAlign = 'center'
    c.fillText(s.set, 256, l.height * 0.4)
  }
  const banda = Math.max(56, l.height * 0.16)
  c.fillStyle = '#ffcb05'
  c.fillRect(0, l.height - banda, 512, banda)
  c.fillStyle = '#1d3f8f'
  c.font = `600 ${Math.round(banda * 0.42)}px Poppins, sans-serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(ETIQUETA[s.formato], 256, l.height - banda / 2)
  c.restore()
  const t = new CanvasTexture(l)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Una sola pieza por producto: el frente usa la parte izquierda de la textura
// y los demás lados, la tira de color de la derecha.
function cajaConFrente(medidas: [number, number, number]) {
  const g = new BoxGeometry(...medidas)
  const uv = g.attributes.uv
  const corte = 512 / 528
  for (let i = 0; i < uv.count; i++) {
    const frente = Math.floor(i / 4) === 4
    uv.setX(i, frente ? uv.getX(i) * corte : corte + 0.005 + uv.getX(i) * (1 - corte - 0.01))
  }
  g.clearGroups()
  return g
}

export function Sellado3D({ sellado, posicion, giro }: { sellado: Sellado; posicion: [number, number, number]; giro: number }) {
  const grupo = useRef<Group>(null!)
  const apuntado = useEstado(e => e.apuntado === sellado.id)
  const medidas = MEDIDAS_SELLADO[sellado.formato]
  const inspeccionar = useInspeccion(sellado.id, grupo, FRENTE, Math.max(1.2, medidas[1] / 0.12))
  const brillo = sellado.formato === 'sobre' || sellado.formato === 'lata'

  const material = useMemo(() => new MeshStandardMaterial({ color: '#ffffff', roughness: brillo ? 0.25 : 0.5, metalness: brillo ? 0.45 : 0 }), [brillo])
  const geometria = useMemo(() => cajaConFrente(medidas), [medidas])
  useEffect(() => () => geometria.dispose(), [geometria])

  useEffect(() => {
    let vivo = true
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const listo = (color: string, logo: HTMLImageElement | null) => {
      if (!vivo) return
      material.map?.dispose()
      material.map = pintarFrente(sellado, color, logo)
      material.needsUpdate = true
    }
    if (!sellado.logo) { listo('#2b4a9a', null); return }
    img.onload = () => colorDominante(sellado.logo!).then(c => listo(c, img)).catch(() => listo('#2b4a9a', img))
    img.onerror = () => listo('#2b4a9a', null)
    img.src = sellado.logo
    return () => { vivo = false }
  }, [sellado, material])

  useEffect(() => {
    const g = grupo.current
    g.traverse(o => { o.userData.id = sellado.id })
    mallasLibros.set(sellado.id, g)
    return () => { mallasLibros.delete(sellado.id) }
  }, [sellado.id])

  const pos = useMemo(() => new Vector3(...posicion), [posicion])
  const rot = useMemo(() => new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), giro), [giro])
  const normal = useMemo(() => new Vector3(Math.sin(giro), 0, Math.cos(giro)), [giro])
  const listo = useRef(false)

  useFrame((_, dt) => {
    const g = grupo.current
    if (!listo.current) { listo.current = true; g.position.copy(pos); g.quaternion.copy(rot) }
    if (inspeccionar(dt, pos, rot)) return
    g.quaternion.copy(rot)
    g.position.copy(pos).addScaledVector(normal, apuntado ? 0.02 : 0)
  })

  return (
    <group ref={grupo}>
      <mesh geometry={geometria} material={material} receiveShadow />
    </group>
  )
}
