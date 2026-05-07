import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '10px',
          },
          success: { iconTheme: { primary: '#1db954', secondary: '#000' } },
          error: { iconTheme: { primary: '#ff3b3b', secondary: '#fff' } },
          duration: 3000,
        }}
      />
      <App />
    </BrowserRouter>
  </StrictMode>
)