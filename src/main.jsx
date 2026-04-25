import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { InventoryProvider } from './InventoryContext'
import './style.css'
import './wordBank.css'
import './wordProfile.css'
import './onboarding.css'
import './practice.css'
import './worldSphere.css'
import './sentencelab.css'
import './wordTrial.css'
import './discover.css'
import './admin.css'
import './celestial.css'
import './editor.css'
import './profiles.css'
import './aitext.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <InventoryProvider>
      <App />
    </InventoryProvider>
  </React.StrictMode>
)
