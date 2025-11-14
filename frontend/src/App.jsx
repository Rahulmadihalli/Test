import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";

const Gallery = lazy(() => import("./pages/Gallery.jsx"));
const Booking = lazy(() => import("./pages/Booking.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Suspense fallback={<div className="page-loading">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;

