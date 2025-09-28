import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import SignupPage from './pages/SignupPage';   // <-- import your SignupPage
import { FaWhatsapp } from 'react-icons/fa';

const WhatsAppButton: React.FC = () => (
  <a
    href="https://wa.me/917997719874"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
    aria-label="Chat with us on WhatsApp"
  >
    <FaWhatsapp className="h-7 w-7" />
  </a>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/signup" element={<SignupPage />} />   {/* <-- add this */}
      </Routes>
      <WhatsAppButton />
    </Router>
  );
};

export default App;
