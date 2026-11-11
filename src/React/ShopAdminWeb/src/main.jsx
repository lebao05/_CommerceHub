import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CatalogProvider } from './store/catalog.jsx';
import { UsersProvider } from './store/users.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CatalogProvider>
        <UsersProvider>
          <App />
        </UsersProvider>
      </CatalogProvider>
    </BrowserRouter>
  </React.StrictMode>
);
