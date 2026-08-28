import React from 'react';
import ReactDOM from 'react-dom/client';

// ✅ Disable console logs in production
if (process.env.NODE_ENV === 'production') {
    console.log = () => { };
    console.warn = () => { };
    console.error = () => { };
    console.info = () => { };
    console.debug = () => { };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);