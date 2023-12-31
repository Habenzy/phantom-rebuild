import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./config/authContext";
import "./App.css";

import Burger from "./sections/nav_bar/Burger";
import Nav from "./sections/nav_bar/Nav";
import Footer from "./sections/footer/Footer";
import Home from "./pages/home/Home";
import Season from "./pages/season/Season";
import Donate from "./pages/donate/Donate";
import ArtistsList from "./pages/artists/Artists";
import About from "./pages/about/About";
import ArtistPortal from "./pages/artist_portal/ArtistPortal";
import AdminPortal from "./pages/admin_portal/AdminPortal";

function App() {
  return (
    <Router>
      <div className="App">
        <Burger />
        <Nav />
        <AuthProvider>
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route path="/Season" element={<Season />} />
            <Route path="/About" element={<About />} />
            <Route path="/Artists" element={<ArtistsList />} />
            <Route path="/Donate" element={<Donate />} />
            <Route path="/ArtistPortal" element={<ArtistPortal />}/>
            <Route path="/adminDash" element={<AdminPortal />} />
          </Routes>
        </AuthProvider>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
