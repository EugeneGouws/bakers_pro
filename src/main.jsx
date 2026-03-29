import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import BakersCostPro from './BakersCostPro.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BakersCostPro />
    </StrictMode>,
)