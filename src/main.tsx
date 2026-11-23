import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setConsoleFunction } from 'three'
import './index.css'
import App from './App.tsx'
import { arrancarNube } from './sincronizar'

// React Three Fiber 9.8 (la última estable) aún crea un THREE.Clock por dentro;
// el cambio a THREE.Timer llega con su versión 10. Se calla solo ese aviso.
setConsoleFunction((tipo, mensaje, ...resto) => {
  if (tipo === 'warn' && String(mensaje).includes('THREE.Clock')) return
  ;(console[tipo as 'log' | 'warn' | 'error'] ?? console.log)(mensaje, ...resto)
})

arrancarNube()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
