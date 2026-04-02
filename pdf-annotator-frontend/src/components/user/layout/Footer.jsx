import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            © 2025 PDF Annotator. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Github size={20} />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Linkedin size={20} />
            </a>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-900">Privacy</a>
            <a href="#" className="hover:text-gray-900">Terms</a>
            <a href="#" className="hover:text-gray-900">Help</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;