import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n';
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { MSEProvider } from './context/MSEContext'
import { ToastProvider } from './context/ToastContext'
import { NotificationProvider } from './context/NotificationContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <MSEProvider>
            <App />
          </MSEProvider>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
