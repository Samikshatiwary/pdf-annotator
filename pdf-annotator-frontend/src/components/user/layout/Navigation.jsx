import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getBreadcrumbs = () => {
    const breadcrumbs = [{ label: 'Home', path: '/dashboard' }];
    
    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center gap-2 text-sm py-3">
      <button
        onClick={() => navigate('/dashboard')}
        className="text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home size={16} />
      </button>
      
      {breadcrumbs.slice(1).map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          <ChevronRight size={16} className="text-gray-400" />
          <button
            onClick={() => navigate(crumb.path)}
            className={`transition-colors ${
              index === breadcrumbs.length - 2
                ? 'text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Navigation;