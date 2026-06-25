import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-gradient-to-b from-sky-900/95 to-blue-800/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">✈️</span>
            <span className="text-white font-bold text-xl">TripAI</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-white/80 hover:text-white transition-colors font-semibold">
              Home
            </Link>
            <Link to="/destinations" className="text-white/80 hover:text-white transition-colors font-semibold">
              Destinations
            </Link>
            {token && (
              <Link to="/planner" className="text-white/80 hover:text-white transition-colors font-semibold">
                Planner
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {token ? (
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-full transition-all duration-300"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-white hover:text-blue-200 transition-colors font-semibold"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-full transition-all duration-300"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-white/10">
            <Link
              to="/"
              className="block px-4 py-2 text-white hover:bg-white/10 rounded transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/destinations"
              className="block px-4 py-2 text-white hover:bg-white/10 rounded transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Destinations
            </Link>
            {token && (
              <Link
                to="/planner"
                className="block px-4 py-2 text-white hover:bg-white/10 rounded transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Planner
              </Link>
            )}
            <div className="border-t border-white/10 mt-4 pt-4 px-4 space-y-2">
              {token ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-lg"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-2 text-white hover:bg-white/10 rounded"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full text-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
