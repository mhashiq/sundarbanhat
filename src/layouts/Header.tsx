import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on page transition
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <header className="header">
      <div className="container">
        <nav className="navbar">
          <Link to="/" className="nav-brand">
            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="সুন্দরবন হাট লোগো" />
            সুন্দরবন হাট
          </Link>

          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="মেনু"
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>

          <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
            <li>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                হোম
              </NavLink>
            </li>
            <li>
              <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                পণ্যসমূহ
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                আমাদের সম্পর্কে
              </NavLink>
            </li>
            <li>
              <NavLink to="/why-us" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                কেন আমরা
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                যোগাযোগ
              </NavLink>
            </li>
            <li>
              <NavLink to="/faq" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                জিজ্ঞাসা ও ব্লগ
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
