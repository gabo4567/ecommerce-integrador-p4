import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Promotions from './pages/Promotions';
import Inventory from './pages/Inventory';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 px-6 py-6 max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="*" element={<div><p>Not Found. <Link to="/" className="text-blue-600">Volver</Link></p></div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
