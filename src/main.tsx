import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { chiediPersistenza } from './db/repo';
// Caratteri contenuti nell'app (niente richieste a Google): solo i pesi usati
import '@fontsource/caveat/latin-500.css';
import '@fontsource/caveat/latin-700.css';
import '@fontsource/kalam/latin-400.css';
import '@fontsource/kalam/latin-700.css';
import './styles.css';
import { accogliCondivisione } from './views/ArrivoCondivisione';
import { preparaInstallazione } from './app/installazione';

preparaInstallazione(); // l'evento "installa" arriva presto: lo teniamo da parte
accogliCondivisione(); // prima del primo render: l'app può essere stata aperta da "Condividi"
registerSW({ immediate: true });
void chiediPersistenza();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
