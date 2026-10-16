import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import PreviewApp from './PreviewApp';
import { previewRoutes, type PreviewScreen } from './routes';
import './tokens.module.scss';
import './preview.css';

const requestedScreen = new URLSearchParams(window.location.search).get('screen');
const initialScreen = requestedScreen && Object.prototype.hasOwnProperty.call(previewRoutes, requestedScreen)
  ? requestedScreen as PreviewScreen
  : 'home';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MemoryRouter initialEntries={[
      previewRoutes[initialScreen],
    ]}>
      <PreviewApp />
    </MemoryRouter>
  </React.StrictMode>,
);
