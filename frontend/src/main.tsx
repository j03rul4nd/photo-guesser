import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './index.css'

import { HomePage }         from './pages/HomePage'
import { JoinPage }         from './pages/JoinPage'
import { SalaPage }         from './pages/SalaPage'
import { LobbyPage }        from './pages/LobbyPage'
import { GamePage }         from './pages/GamePage'
import { NotFoundPage }     from './pages/NotFoundPage'
import { DesignSystemPage } from './pages/DesignSystemPage'
import { ToastContainer }   from './components/ui/toast'
import { RotatePrompt }     from './components/shared/RotatePrompt'
import { applyReducedMotion } from './lib/animations'

// ─── Aplicar prefers-reduced-motion globalmente ───────────────────────────────
applyReducedMotion()

// ─── Aplicar modo oscuro guardado ─────────────────────────────────────────────
try {
  if (localStorage.getItem('pg_dark_mode') === '1') {
    document.documentElement.classList.add('dark')
  }
} catch { /* localStorage no disponible */ }

const router = createBrowserRouter([
  { path: '/',                    element: <HomePage /> },
  { path: '/unirse',              element: <JoinPage /> },
  { path: '/sala/:code',          element: <SalaPage /> },
  { path: '/sala/:code/lobby',    element: <LobbyPage /> },
  { path: '/sala/:code/juego',    element: <GamePage /> },
  { path: '/design-system',       element: <DesignSystemPage /> },
  { path: '*',                    element: <NotFoundPage /> },
])

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
    <ToastContainer />
    <RotatePrompt />
  </StrictMode>,
)
