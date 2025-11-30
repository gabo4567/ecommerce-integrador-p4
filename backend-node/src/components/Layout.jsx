import React from 'react';
import Header from './Header';
import AdminSidebar from './AdminSidebar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

