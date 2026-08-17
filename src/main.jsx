import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx' // Make sure src/AdminDashboard.jsx exists
import './index.css' // Loads Tailwind CSS

// Checks if the user is on localhost:5173/admin
const isAdminPath = window.location.pathname === '/admin';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdminPath ? <AdminDashboard /> : <App />}
  </React.StrictMode>,
)