import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import CategoryList from "@/pages/CategoryList";
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
import AdminProducts from "@/pages/AdminProducts";
import AdminProductForm from "@/pages/AdminProductForm";
import AdminShipments from "@/pages/AdminShipments";
import AdminOrders from "@/pages/AdminOrders";
import AdminOrderDetails from "@/pages/AdminOrderDetails";
import AdminUsers from "@/pages/AdminUsers";
import AdminUserDetail from "@/pages/AdminUserDetail";
import AdminSupport from "@/pages/AdminSupport";
import RequireAdmin from "@/components/RequireAdmin";

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
        <Route path="/admin/auditoria" element={<RequireAdmin><AdminAudit /></RequireAdmin>} />
        <Route path="/admin/productos" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
        <Route path="/admin/producto/nuevo" element={<RequireAdmin><AdminProductForm /></RequireAdmin>} />
        <Route path="/admin/producto/:id" element={<RequireAdmin><AdminProductForm /></RequireAdmin>} />
        <Route path="/admin/envios" element={<RequireAdmin><AdminShipments /></RequireAdmin>} />
        <Route path="/admin/soporte" element={<RequireAdmin><AdminSupport /></RequireAdmin>} />
        <Route path="/admin/ordenes" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
        <Route path="/admin/orden/:id" element={<RequireAdmin><AdminOrderDetails /></RequireAdmin>} />
        <Route path="/admin/usuarios" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
        <Route path="/admin/usuario/:id" element={<RequireAdmin><AdminUserDetail /></RequireAdmin>} />
        <Route path="/pedido/:id" element={<OrderDetails />} />
        <Route path="/categorias" element={<CategoryList />} />
      </Routes>
    </Router>
  );
}

