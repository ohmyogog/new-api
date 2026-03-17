import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'react-hot-toast'
import { StatusProvider } from '@/contexts/StatusContext'
import { appBasePath } from '@/lib/routes'
import './index.css'
import App from './App.tsx'

const routerBasename = appBasePath === '/' ? undefined : appBasePath

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <StatusProvider>
        <TooltipProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: '1rem',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.08)',
                border: '1px solid #f1f5f9',
                fontSize: '14px',
              },
            }}
          />
        </TooltipProvider>
      </StatusProvider>
    </BrowserRouter>
  </StrictMode>,
)
