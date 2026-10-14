import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import PreviewApp from './PreviewApp';
import { headerRoutes, type HeaderPage } from '../widgets/header/navigation';
import './tokens.module.scss';
import './preview.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MemoryRouter initialEntries={[
      headerRoutes[new URLSearchParams(window.location.search).get('screen') as HeaderPage]
        ?? headerRoutes.home,
    ]}>
      <PreviewApp />
    </MemoryRouter>
  </React.StrictMode>,
);
