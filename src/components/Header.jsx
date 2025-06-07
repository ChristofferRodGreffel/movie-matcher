import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import supabase from "../api/supabase";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    await ensureUserIdExists();
    const currentUserId = localStorage.getItem("user_id");
    setUserId(currentUserId);
  };

  const ensureUserIdExists = async () => {
    let userId = localStorage.getItem("user_id");

    if (!userId) {
      userId = uuidv4();
      localStorage.setItem("user_id", userId);

      try {
        // Insert user into database
        await supabase.from("users").insert({
          id: userId,
        });
      } catch (error) {
        console.error("Failed to create user:", error);
      }
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogoClick = () => {
    navigate("/");
    setIsMenuOpen(false);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const UserAvatar = ({ className = "w-8 h-8" }) => {
    if (!userId) {
      return (
        <div
          className={`${className} bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-semibold`}
        >
          ?
        </div>
      );
    }

    return (
      <>
        <img
          src={`https://api.dicebear.com/9.x/identicon/svg?seed=${userId}`}
          alt="User Avatar"
          className={`${className} rounded-full object-cover`}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <div
          className={`${className} bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold`}
          style={{ display: "none" }}
        >
          {userId.charAt(0).toUpperCase()}
        </div>
      </>
    );
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={handleLogoClick}
            className="text-2xl font-bold text-black cursor-pointer hover:text-blue-600 transition-colors"
          >
            Movie Matcher
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`font-medium transition-colors ${
                isActive("/") ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Home
            </Link>

            <Link
              to="/join"
              className={`font-medium transition-colors ${
                isActive("/join") ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Join Session
            </Link>

            {/* <Link
              to="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Session
            </Link> */}

            {/* User Avatar */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Go to My Sessions"
            >
              <UserAvatar />
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile User Avatar */}
            <Link
              to="/dashboard"
              className="flex items-center p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Go to My Sessions"
            >
              <UserAvatar />
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                onClick={handleLinkClick}
                className={`font-medium transition-colors ${
                  isActive("/") ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                }`}
              >
                Home
              </Link>

              <Link
                to="/join"
                onClick={handleLinkClick}
                className={`font-medium transition-colors ${
                  isActive("/join") ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                }`}
              >
                Join Session
              </Link>

              <Link
                to="/dashboard"
                onClick={handleLinkClick}
                className={`font-medium transition-colors ${
                  isActive("/dashboard") ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                }`}
              >
                My Sessions
              </Link>

              <Link
                to="/"
                onClick={handleLinkClick}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
              >
                Create Session
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
