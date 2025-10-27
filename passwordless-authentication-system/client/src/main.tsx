import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import RootLayout from './pages/RootLayout'

ReactDOM.createRoot(document.getElementById('root')!).render(
   <BrowserRouter>
     <RootLayout />
   </BrowserRouter>
)
