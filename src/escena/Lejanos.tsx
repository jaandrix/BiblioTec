import { useEffect, useMemo, useRef } from 'react'
import { BoxGeometry, Color, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three'

// Los libros y cajas lejanos se dibujan todos juntos, como cajas de su color,
// en UNA sola llamada de dibujo (InstancedMesh). Cuando te acercas, cada uno
// vuelve a ser su propia pieza con su textura (ver Libro.tsx).

export const lejanos: { malla: InstancedMesh | null } = { malla: null }
const oculto = new Matrix4().makeScale(0, 0, 0)
const tmp = { m: new Matrix4(), s: new Vector3(), c: new Color() }

export function ponerLejano(indice: number, posicion: Vector3, giro: Quaternion, medidas: [number, number, number], color: string) {
  const malla = lejanos.malla
  if (!malla || indice >= malla.count) return
  malla.setMatrixAt(indice, tmp.m.compose(posicion, giro, tmp.s.set(...medidas)))
  malla.setColorAt(indice, tmp.c.set(color))
  malla.instanceMatrix.needsUpdate = true
  if (malla.instanceColor) malla.instanceColor.needsUpdate = true
}

export function quitarLejano(indice: number) {
  const malla = lejanos.malla
  if (!malla || indice >= malla.count) return
  malla.setMatrixAt(indice, oculto)
  malla.instanceMatrix.needsUpdate = true
}

export function LibrosLejanos({ cuantos }: { cuantos: number }) {
  const malla = useRef<InstancedMesh>(null!)
  const geometria = useMemo(() => new BoxGeometry(1, 1, 1), [])
  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.7 }), [])
  const capacidad = Math.max(64, Math.ceil(cuantos / 64) * 64)

  useEffect(() => {
    const m = malla.current
    for (let i = 0; i < m.count; i++) { m.setMatrixAt(i, oculto); m.setColorAt(i, tmp.c.set('#ffffff')) }
    m.instanceMatrix.needsUpdate = true
    lejanos.malla = m
    return () => { if (lejanos.malla === m) lejanos.malla = null }
  }, [capacidad])

  return <instancedMesh key={capacidad} ref={malla} args={[geometria, material, capacidad]} frustumCulled={false} receiveShadow />
}
