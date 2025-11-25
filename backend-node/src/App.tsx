import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProductSearch from "@/pages/ProductSearch";
import ShoppingCart from "@/pages/ShoppingCart";
import Checkout from "@/pages/Checkout";
import UserProfile from "@/pages/UserProfile";
import OrderTracking from "@/pages/OrderTracking";
import ProductDetail from "@/pages/ProductDetail";
import PasswordResetRequest from "@/pages/PasswordResetRequest";
import PasswordResetConfirm from "@/pages/PasswordResetConfirm";
import ChangePassword from "@/pages/ChangePassword";
import Support from "@/pages/Support";
import SystemSettings from "@/pages/SystemSettings";
import AdminAudit from "@/pages/AdminAudit";
import OrderDetails from "@/pages/OrderDetails";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/productos" element={<ProductSearch />} />
        <Route path="/carrito" element={<ShoppingCart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/perfil" element={<UserProfile />} />
        <Route path="/seguimiento" element={<OrderTracking />} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        <Route path="/recuperar-contrasena" element={<PasswordResetRequest />} />
        <Route path="/recuperar-contrasena/confirmar" element={<PasswordResetConfirm />} />
        <Route path="/cambiar-contrasena" element={<ChangePassword />} />
        <Route path="/soporte" element={<Support />} />
        <Route path="/ajustes" element={<SystemSettings />} />
        <Route path="/admin/auditoria" element={<AdminAudit />} />
        <Route path="/pedido/:id" element={<OrderDetails />} />
      </Routes>
    </Router>
  );
}
