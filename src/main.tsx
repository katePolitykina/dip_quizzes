import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.tsx'
import { store } from './store/store'
import { I18nProvider } from './i18n/I18nProvider'
import { LanguageSwitcher } from './components/layout/LanguageSwitcher'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <Provider store={store}>
        <LanguageSwitcher />
        <App />
      </Provider>
    </I18nProvider>
  </StrictMode>,
)
