import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Navigation from './Navigation';
import OfflineIndicator from '../../offline/OfflineIndicator';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <Navigation />
          <Outlet />
        </main>

        <Footer />
      </div>

      <OfflineIndicator />
    </div>
  );
};

export default Layout;