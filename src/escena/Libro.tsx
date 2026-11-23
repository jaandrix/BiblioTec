import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Euler, Group, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { cambiarEstado, leerEstado, useEstado } from '../estado'
import { colorDeLibro, colorDominante } from '../libros/color'
import { cajaLibro, estiloDe, piezasCajaAbierta, texturaLibro } from '../libros/lomo'
import type { Hueco, Libro as TLibro } from '../tipos'
import { huecoCarro } from './Carro'
import { altoLibro, fondoLibro, grosorLibro } from './distribucion'
import { control, giroInspeccion, mallasLibros } from './registro'
import { encolarTextura } from './Rendimiento'
import { ponerLejano, quitarLejano } from './Lejanos'

export type Destino =
  | { tipo: 'balda'; hueco: Hueco }
  | { tipo: 'carro'; indice: number }
  | { tipo: 'mesa'; posicion: [number, number, number]; giro: number }

const SACAR = 0.13
const ARRIBA = new Vector3(0, 1, 0)
const DELANTE = new Vector3(0, 0, 1)
const GIRO_PORTADA = new Quaternion().setFromAxisAngle(ARRIBA, -Math.PI / 2)
const TUMBADO = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2)
// De frente en la balda: la portada mira al pasillo y el libro se recuesta un poco.
const EXPUESTO = new Quaternion().setFromAxisAngle(ARRIBA, -Math.PI / 2).multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), 0.12))

const curva = (t: number) => 1 - (1 - t) ** 3
const curvaSuave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function firma(d: Destino) {
  if (d.tipo === 'balda') return `b${d.hueco.posicion.join(',')}${d.hueco.expuesto ? 'e' : ''}`
  if (d.tipo === 'carro') return `c${d.indice}`
  return `m${d.posicion.join(',')}`
}

type Fase = 'reposo' | 'viaje' | 'abriendo'

// Disco genérico: plateado, muy metálico, para que refleje la luz al girarlo.
const DISCO = new MeshStandardMaterial({ color: '#dde2e8', metalness: 1, roughness: 0.14 })
const CENTRO_DISCO = new MeshStandardMaterial({ color: '#b8bcc2', metalness: 0.6, roughness: 0.35, transparent: true, opacity: 0.85 })
const CUERPO_CARTUCHO = new MeshStandardMaterial({ color: '#2a2b2f', roughness: 0.5 })
const CARTUCHOS: Record<string, [number, number]> = { switch: [0.031, 0.021], ds: [0.033, 0.035], '3ds': [0.033, 0.035] }

export function Libro({ libro, destino, indice }: { libro: TLibro; destino: Destino; indice: number }) {
  const malla = useRef<Group>(null!)
  const cerrada = useRef<Mesh>(null!)
  const abiertaRef = useRef<Group>(null!)
  const pivote = useRef<Group>(null!)
  const abre = useRef(0)
  const apuntado = useEstado(e => e.apuntado === libro.id)
  const abierto = useEstado(e => e.abierto === libro.id)
  const grosor = grosorLibro(libro)
  const alto = altoLibro(libro)
  const fondo = fondoLibro(libro)
  const geometria = useMemo(() => cajaLibro(grosor, alto, fondo), [grosor, alto, fondo])
  useEffect(() => () => geometria.dispose(), [geometria])
  // Las cajas (juegos y películas) se abren al cogerlas: piezas solo para ellas.
  const estilo = estiloDe(libro)
  const piezas = useMemo(() => (estilo ? piezasCajaAbierta(grosor, alto, fondo) : null), [estilo, grosor, alto, fondo])
  useEffect(() => () => { if (piezas) Object.values(piezas).forEach(g => g.dispose()) }, [piezas])
  const plataforma = (libro.plataforma ?? '').toLowerCase()
  const cartucho = libro.tipo === 'videojuego' ? CARTUCHOS[/3ds/.test(plataforma) ? '3ds' : /\bds\b/.test(plataforma) ? 'ds' : /switch/.test(plataforma) ? 'switch' : ''] : undefined
  const destinoRef = useRef(destino)
  destinoRef.current = destino

  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.6, emissive: '#ffb347', emissiveIntensity: 0 }), [libro])
  useEffect(() => () => { material.map?.dispose(); material.dispose() }, [material])

  // La portada real solo se baja cuando se va a ver: al abrir el libro o si
  // espera tumbado en la mesa de la entrada. Al abrirlo se pinta en alta.
  const verPortada = abierto || destino.tipo === 'mesa' || (destino.tipo === 'balda' && !!destino.hueco.expuesto)
  const estadoTextura = useRef<{ fondo: string; img: HTMLImageElement | null; alta: boolean }>({ fondo: colorDeLibro(libro), img: null, alta: false })

  // Solo los objetos cercanos (o en la mano, la mesa o el carro) llevan su
  // textura; los lejanos se ven de su color, que a esa distancia basta. Así una
  // biblioteca de cientos de libros no llena la memoria de la gráfica.
  // cerca empieza sin decidir: el primer vistazo lo pone en un modo u otro.
  const lod = useRef<{ cerca: boolean | null; cuenta: number }>({ cerca: null, cuenta: libro.id.length % 8 })
  const pintarRef = useRef<() => void>(() => {})
  useEffect(() => {
    let vivo = true
    const e = estadoTextura.current
    const pintar = () => {
      if (!vivo || !lod.current.cerca) return
      material.map?.dispose()
      material.map = texturaLibro(libro, grosor, alto, e.fondo, e.img, e.alta)
      material.color.set('#ffffff')
      material.needsUpdate = true
    }
    pintarRef.current = () => encolarTextura(pintar)
    if (!material.map) material.color.set(estiloDe(libro)?.plastico ?? e.fondo)
    e.alta = abierto
    if (abierto) lod.current.cerca = true
    if (lod.current.cerca) document.fonts.load('600 20px Poppins').finally(() => (abierto ? pintar() : encolarTextura(pintar)))
    if (libro.portada && !e.img && verPortada) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { e.img = img; pintar() }
      img.src = libro.portada
    }
    if (libro.portada) colorDominante(libro.portada).then(c => { if (c !== e.fondo) { e.fondo = c; if (!material.map) material.color.set(estiloDe(libro)?.plastico ?? c); encolarTextura(pintar) } }).catch(() => {})
    return () => { vivo = false }
  }, [libro, material, grosor, alto, verPortada, abierto])

  useEffect(() => {
    const m = malla.current
    m.traverse(o => { o.userData.id = libro.id })
    mallasLibros.set(libro.id, m)
    return () => { mallasLibros.delete(libro.id); quitarLejano(indice) }
  }, [libro.id, indice])

  const objetivo = useMemo(() => {
    const pos = new Vector3(), rot = new Quaternion(), normal = new Vector3()
    return (d: Destino) => {
      if (d.tipo === 'balda') {
        pos.set(...d.hueco.posicion)
        rot.setFromAxisAngle(ARRIBA, d.hueco.giro)
        if (d.hueco.expuesto) rot.multiply(EXPUESTO)
      } else if (d.tipo === 'mesa') {
        pos.set(...d.posicion)
        rot.setFromAxisAngle(ARRIBA, d.giro).multiply(TUMBADO)
      } else {
        const carro = control.carro
        pos.set(...huecoCarro(d.indice, alto))
        if (carro) { carro.localToWorld(pos); rot.copy(carro.quaternion) } else rot.identity()
      }
      normal.copy(DELANTE).applyQuaternion(rot)
      return { pos, rot, normal }
    }
  }, [alto])

  const anim = useRef({
    fase: 'reposo' as Fase,
    t: 0,
    duracion: 1,
    elevar: 0.03,
    firma: '',
    desdePos: new Vector3(),
    desdeRot: new Quaternion(),
    normalDesde: new Vector3(),
    abrirPos: new Vector3(),
    abrirRot: new Quaternion(),
  })

  const empezarViaje = (desdeTipo: string | null) => {
    const a = anim.current
    const m = malla.current
    const d = destinoRef.current
    a.desdePos.copy(m.position)
    a.desdeRot.copy(m.quaternion)
    a.normalDesde.copy(DELANTE).applyQuaternion(m.quaternion)
    const objetivoPos = objetivo(d).pos
    const lejos = a.desdePos.distanceTo(objetivoPos)
    a.duracion = Math.min(1.1, 0.45 + lejos * 0.12)
    const entreBaldas = desdeTipo === 'b' && d.tipo === 'balda'
    a.elevar = entreBaldas ? 0.03 : Math.min(0.35, 0.08 + lejos * 0.06)
    // Al reordenar, en cascada, para que se vea la estantería moverse.
    a.t = entreBaldas ? -Math.min(d.hueco.orden * 0.018, 0.9) / a.duracion : 0
    a.fase = 'viaje'
  }

  useEffect(() => {
    const a = anim.current
    const m = malla.current
    const nueva = firma(destino)
    if (!a.firma) {
      const { pos, rot } = objetivo(destino)
      m.position.copy(pos)
      m.quaternion.copy(rot)
      a.firma = nueva
      return
    }
    if (nueva === a.firma) return
    const antes = a.firma[0]
    a.firma = nueva
    if (a.fase === 'abriendo') return
    empezarViaje(antes)
  })

  useEffect(() => {
    const a = anim.current
    const m = malla.current
    if (abierto) {
      a.desdePos.copy(m.position)
      a.desdeRot.copy(m.quaternion)
      const cam = control.camara!
      const delante = new Vector3(0, 0, -1).applyQuaternion(cam.quaternion)
      const izquierda = new Vector3(-1, 0, 0).applyQuaternion(cam.quaternion)
      a.abrirPos.copy(cam.position).addScaledVector(delante, giroInspeccion.distancia).addScaledVector(izquierda, 0.07)
      a.abrirRot.copy(cam.quaternion)
      a.t = 0
      a.duracion = 0.7
      a.fase = 'abriendo'
      // Abierta, la caja ocupa el doble de ancho: un poco más lejos para verla entera.
      if (estilo && libro.formato !== 'cartucho') giroInspeccion.distancia = Math.max(giroInspeccion.distancia, 0.5)
      if (leerEstado().guia === libro.id) cambiarEstado({ guia: null })
    } else if (a.fase === 'abriendo') {
      empezarViaje(null)
      a.duracion = 0.5
      a.elevar = 0
    }
  }, [abierto, libro.id, estilo, libro.formato])

  const tmpRot = useMemo(() => new Quaternion(), [])
  const tmpPos = useMemo(() => new Vector3(), [])
  const tmpGiro = useMemo(() => new Quaternion(), [])
  const fuera = useMemo(() => new Vector3(), [])
  const euler = useMemo(() => new Euler(), [])

  useFrame(({ clock }, dt) => {
    const a = anim.current
    const m = malla.current
    const guiando = leerEstado().guia === libro.id
    const brillo = guiando ? 0.35 + 0.35 * Math.sin(clock.elapsedTime * 5) : 0
    material.emissiveIntensity = brillo
    const d = destinoRef.current
    const { pos, rot, normal } = objetivo(d)

    // Cerca: pieza propia con textura. Lejos y quieto en su balda: se dibuja
    // dentro del conjunto de lejanos (una sola llamada para todos).
    const l = lod.current
    if (--l.cuenta <= 0) {
      l.cuenta = 15
      const cam = control.camara
      const lejos = cam ? cam.position.distanceTo(m.position) : 0
      const quieto = a.fase === 'reposo' && d.tipo === 'balda'
      const quiere = abierto || !quieto || lejos < (l.cerca ? 2.5 : 2)
      if (quiere !== l.cerca) {
        l.cerca = quiere
        if (quiere) {
          quitarLejano(indice)
          m.visible = true
          pintarRef.current()
        } else {
          material.map?.dispose()
          material.map = null
          material.color.set(estiloDe(libro)?.plastico ?? estadoTextura.current.fondo)
          material.needsUpdate = true
          m.visible = false
          ponerLejano(indice, pos, rot, [grosor, alto, fondo], estiloDe(libro)?.plastico ?? estadoTextura.current.fondo)
        }
      } else if (!l.cerca) ponerLejano(indice, pos, rot, [grosor, alto, fondo], estiloDe(libro)?.plastico ?? estadoTextura.current.fondo)
    }

    // Apertura de la caja cuando ya está delante de ti; al soltarla se cierra
    // rápido mientras vuela de vuelta.
    if (piezas) {
      const meta = a.fase === 'abriendo' && a.t >= 1 ? 1 : 0
      abre.current += (meta - abre.current) * (1 - Math.exp(-(meta ? 4.5 : 14) * dt))
      const p = abre.current < 0.002 ? 0 : abre.current
      cerrada.current.visible = p === 0
      abiertaRef.current.visible = p > 0
      if (p > 0) {
        const suave = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2
        pivote.current.rotation.y = -Math.PI * suave
        abiertaRef.current.position.z = -(fondo / 2) * suave
      }
    }

    if (a.fase === 'abriendo') {
      a.t = Math.min(1, a.t + dt / a.duracion)
      // El giro se aplica en los ejes de la cámara: arrastrar a los lados lo hace
      // girar sobre sí mismo, arriba y abajo lo inclina hacia ti. Sin giro, la
      // portada mira de frente.
      euler.set(giroInspeccion.x, giroInspeccion.y, 0, 'XYZ')
      tmpRot.copy(a.abrirRot).multiply(tmpGiro.setFromEuler(euler)).multiply(GIRO_PORTADA)
      const cam = control.camara
      if (cam) {
        const delante = fuera.set(0, 0, -1).applyQuaternion(cam.quaternion)
        a.abrirPos.copy(cam.position).addScaledVector(delante, giroInspeccion.distancia)
        a.abrirPos.addScaledVector(fuera.set(-1, 0, 0).applyQuaternion(cam.quaternion), 0.07)
      }
      // Primero sale de la balda, luego vuela hacia ti girando hasta enseñar la portada.
      fuera.copy(a.desdePos).addScaledVector(a.normalDesde, SACAR)
      if (a.t < 0.3) {
        m.position.lerpVectors(a.desdePos, fuera, curva(a.t / 0.3))
      } else {
        const p = curva((a.t - 0.3) / 0.7)
        m.position.lerpVectors(fuera, a.abrirPos, p)
        m.quaternion.slerpQuaternions(a.desdeRot, tmpRot, p)
      }
      if (a.t >= 1) m.quaternion.copy(tmpRot)
      return
    }

    if (a.fase === 'viaje') {
      a.t = Math.min(1, a.t + dt / a.duracion)
      if (a.t <= 0) return
      const p = curvaSuave(a.t)
      const arco = Math.sin(Math.PI * p)
      m.position.lerpVectors(a.desdePos, pos, p)
      m.position.addScaledVector(a.normalDesde, arco * 0.14 * (1 - p)).addScaledVector(normal, arco * 0.14 * p)
      m.position.y += arco * a.elevar
      m.quaternion.slerpQuaternions(a.desdeRot, rot, p)
      if (a.t >= 1) a.fase = 'reposo'
      return
    }

    m.quaternion.copy(rot)
    if (d.tipo === 'balda') {
      const sale = apuntado ? 0.025 : 0
      const actual = tmpPos.copy(m.position).sub(pos).dot(normal)
      const siguiente = actual + (sale - actual) * (1 - Math.exp(-18 * dt))
      m.position.copy(pos).addScaledVector(normal, siguiente)
    } else {
      m.position.copy(pos)
      if (apuntado && d.tipo === 'mesa') m.position.y += 0.012
    }
  })

  return (
    <group ref={malla}>
      <mesh ref={cerrada} geometry={geometria} material={material} receiveShadow />
      {piezas && (
        <group ref={abiertaRef} visible={false}>
          <mesh geometry={piezas.bandeja} material={material} position={[-grosor / 4, 0, 0]} />
          {cartucho ? (
            <group position={[0.0018, alto * 0.22, -fondo * 0.12]}>
              <mesh material={CUERPO_CARTUCHO}><boxGeometry args={[0.0034, cartucho[0], cartucho[1]]} /></mesh>
              <mesh geometry={piezas.etiqueta} material={material} position={[0.0018, -cartucho[0] * 0.08, 0]} scale={[1, cartucho[0] * 0.7, cartucho[1] * 0.85]} />
            </group>
          ) : (
            <group position={[0.0009, alto * 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
              <mesh material={DISCO}><cylinderGeometry args={[Math.min(0.06, fondo * 0.44), Math.min(0.06, fondo * 0.44), 0.0012, 48]} /></mesh>
              <mesh material={CENTRO_DISCO} position={[0, 0.0007, 0]}><cylinderGeometry args={[0.018, 0.018, 0.0004, 32]} /></mesh>
            </group>
          )}
          <group ref={pivote} position={[0, 0, fondo / 2]}>
            <mesh geometry={piezas.tapa} material={material} position={[grosor / 4, 0, -fondo / 2]} />
            <mesh geometry={piezas.manual} material={material} position={[-0.0012, 0, -fondo / 2]} />
          </group>
        </group>
      )}
    </group>
  )
}
