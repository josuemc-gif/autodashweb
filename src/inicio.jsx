import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos/base.css'
import Aplicacion from './aplicacion.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Aplicacion />
  </StrictMode>,
)
