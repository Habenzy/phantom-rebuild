import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from './config/authContext';
import './App.css'

import Burger from './sections/nav_bar/Burger'
import Nav from './sections/nav_bar/Nav'
import Footer from './sections/footer/Footer';
import Home from './pages/home/Home'

function App() {
  return (

      <Router>
      <div className="App">
        <Burger />
        <Nav />
        {/* <AuthProvider> Only provides signed in user info*/}
          <Routes>
            <Route exact path="/" component={Home} />
          </Routes>
        {/* </AuthProvider> */}
        <Footer />
      </div>
    </Router>
  )
}

export default App
