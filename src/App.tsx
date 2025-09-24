import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import SignupPage from './pages/SignupPage';   // <-- import your SignupPage

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/signup" element={<SignupPage />} />   {/* <-- add this */}
      </Routes>
    </Router>
  );
};

export default App;

