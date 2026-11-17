import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { chiediPersistenza } from './db/repo';
import './styles.css';
import { accogliCondivisione } from './views/ArrivoCondivisione';

accogliCondivisione(); // prima del primo render: l'app può essere stata aperta da "Condividi"
registerSW({ immediate: true });
void chiediPersistenza();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
