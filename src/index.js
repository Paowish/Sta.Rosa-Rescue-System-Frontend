// src/index.js

// ✅ DISABLE CONSOLE LOGS WHEN ENV VARIABLE IS SET
if (process.env.REACT_APP_DISABLE_LOGS === 'true') {
    console.log = () => { };
    console.warn = () => { };
    console.info = () => { };
    console.debug = () => { };
    console.error = () => { };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);