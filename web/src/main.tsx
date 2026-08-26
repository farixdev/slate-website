import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/*
  Fonts are bundled rather than pulled from a CDN.

  Two variable faces, two weights' worth of file size, and no third-party
  request on first paint — which is both faster and one fewer party who gets to
  see everyone who visits.
*/
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import './styles/tokens.css';
import './styles/layout.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
