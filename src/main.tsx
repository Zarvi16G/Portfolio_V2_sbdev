import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './ui/keys-tiles.css'
import App from './App.tsx'
import { LangProvider } from './i18n/lang'
import { QualityProvider } from './perf/quality'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <QualityProvider>
        <App />
      </QualityProvider>
    </LangProvider>
  </StrictMode>,
)
