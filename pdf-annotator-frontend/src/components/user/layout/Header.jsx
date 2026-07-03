import React, { useState } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { Dropdown, DropdownItem } from '../../ui';
import { getInitials } from '../../../utils/helpers';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/library?search=${encodeURIComponent(q)}` : '/library');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu size={24} />
            </button>
            
            <form onSubmit={handleSearch} className="hidden sm:flex items-center flex-1 max-w-lg">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search PDFs... (press Enter)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </form>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button className="relative text-gray-600 hover:text-gray-900" title="Notifications">
              <Bell size={20} />
            </button>

            <Dropdown
              align="right"
              trigger={
                <button className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="avatar avatar-sm bg-primary-600">
                      {getInitials(user?.name || 'User')}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-gray-900">
                    {user?.name}
                  </span>
                </button>
              }
            >
              <DropdownItem onClick={() => navigate('/profile')}>Profile</DropdownItem>
              <DropdownItem onClick={() => navigate('/settings')}>Settings</DropdownItem>
              <DropdownItem onClick={handleLogout}>Logout</DropdownItem>
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;