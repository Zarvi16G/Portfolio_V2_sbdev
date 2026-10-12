import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// fonts served from this site (the CSP allows no other origin): Poppins for the UI,
// Newsreader + Public Sans for the Patrimonio mini dashboard
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/newsreader/500.css'
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/600.css'
import './index.css'
import './ui/keys-tiles.css'
import './ui/bubbles.css'
import './sections/sections.css'
import './sections/views.css'
import './tv.css'
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
