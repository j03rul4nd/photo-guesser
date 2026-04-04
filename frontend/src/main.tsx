import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './index.css'

// Pages (stubs completadas en Sprint 1.3)
import { HomePage }   from './pages/HomePage'
import { JoinPage }   from './pages/JoinPage'
import { SalaPage }   from './pages/SalaPage'
import { LobbyPage }  from './pages/LobbyPage'
import { GamePage }   from './pages/GamePage'
import { DesignSystemPage } from './pages/DesignSystemPage'

const router = createBrowserRouter([
  { path: '/',                        element: <HomePage /> },
  { path: '/unirse',                  element: <JoinPage /> },
  { path: '/sala/:code',              element: <SalaPage /> },
  { path: '/sala/:code/lobby',        element: <LobbyPage /> },
  { path: '/sala/:code/juego',        element: <GamePage /> },
  // Página temporal de verificación del design system — eliminar antes de Fase 2
  { path: '/design-system',           element: <DesignSystemPage /> },
])

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
