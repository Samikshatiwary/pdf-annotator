import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const Dropdown = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger || (
          <button className="flex items-center gap-1">
            Options <ChevronDown size={16} />
          </button>
        )}
      </div>
      {isOpen && (
        <div className={`dropdown-menu ${align === 'left' ? 'left-0' : 'right-0'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export const DropdownItem = ({ children, onClick, icon }) => {
  return (
    <button onClick={onClick} className="dropdown-item">
      <div className="flex items-center gap-2">
        {icon}
        {children}
      </div>
    </button>
  );
};

export default Dropdown;