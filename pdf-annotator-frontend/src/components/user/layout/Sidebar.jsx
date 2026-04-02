import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Library, 
  FileText, 
  Users, 
  Globe, 
  Settings,
  Activity,
  Star,
  Archive
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Library, label: 'My Library', path: '/library' },
    { icon: Star, label: 'Favorites', path: '/favorites' },
    { icon: Users, label: 'Shared with Me', path: '/shared' },
    { icon: Globe, label: 'Public PDFs', path: '/public' },
    { icon: Archive, label: 'Archived', path: '/archived' },
    { icon: Activity, label: 'Activity', path: '/activity' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <FileText className="text-white" size={20} />
            </div>
            <span className="text-lg font-bold text-gray-900">PDF Annotator</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 mb-1">Upgrade to Pro</p>
              <p className="text-xs text-gray-600 mb-2">Get unlimited storage and features</p>
              <button className="w-full bg-primary-600 text-white text-sm font-medium py-1.5 rounded hover:bg-primary-700 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;