// src/index.js

// ✅ DISABLE ALL CONSOLE LOGS AND WARNINGS IN PRODUCTION (Works with Vite!)
if (process.env.NODE_ENV === 'production') {
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