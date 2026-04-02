import React from 'react';
import { FileText } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex-center">
              <FileText className="text-white" size={28} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          {children}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 PDF Annotator. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;