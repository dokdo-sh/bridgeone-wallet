import React from 'react';
import ReactDOM from 'react-dom';

import './css/index.css';
import App from './App';
import { BrowserRouter, Route, Router, Routes } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
  <BrowserRouter>
      <Routes>
          <Route path="*" element={<App />} />
    </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

