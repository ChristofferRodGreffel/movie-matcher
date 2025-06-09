import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useUserStore from "../stores/userStore";
import ProfileAvatar from "./ProfileAvatar";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { userId, initializeUser } = useUserStore();

  useEffect(() => {
    initializeUser();
  }, []);

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

  return (
    <header className="bg-theme-primary shadow-sm border-b border-theme-primary">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={handleLogoClick}
            className="text-2xl font-bold text-theme-primary cursor-pointer hover:text-theme-link transition-colors"
          >
            Movie Matcher
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`font-medium transition-colors ${isActive("/") ? "text-purple-500" : "text-theme-primary"}`}
            >
              Home
            </Link>

            <Link
              to="/join"
              className={`font-medium transition-colors ${
                isActive("/join") ? "text-purple-500" : "text-theme-primary"
              }`}
            >
              Join Session
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-theme-surface transition-colors"
              title="Go to My Sessions"
            >
              <ProfileAvatar id={userId} size="8" />
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />

            <Link
              to="/dashboard"
              className="flex items-center p-1 rounded-lg hover:bg-theme-surface transition-colors"
              title="Go to My Sessions"
            >
              <ProfileAvatar id={userId} size="8" />
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-theme-secondary hover:bg-theme-surface"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <div
          className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
            isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              isMenuOpen ? "opacity-50" : "opacity-0"
            }`}
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div
            className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-theme-primary shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-theme-primary ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-theme-primary">
              <div className="text-xl font-bold text-theme-primary">Menu</div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg text-theme-secondary hover:text-theme-primary hover:bg-theme-surface transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Content */}
            <nav className="p-6">
              <div className="flex flex-col space-y-4">
                <Link
                  to="/"
                  onClick={handleLinkClick}
                  className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                    isActive("/")
                      ? "bg-theme-link-light text-theme-primary border-l-4 border-theme-link"
                      : "text-theme-primary hover:bg-theme-surface text-theme-link-hover"
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Home
                </Link>

                <Link
                  to="/join"
                  onClick={handleLinkClick}
                  className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                    isActive("/join")
                      ? "bg-theme-link-light text-theme-primary border-l-4 border-theme-link"
                      : "text-theme-primary hover:bg-theme-surface text-theme-link-hover"
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Join Session
                </Link>

                <Link
                  to="/dashboard"
                  onClick={handleLinkClick}
                  className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "bg-theme-link-light text-theme-primary border-l-4 border-theme-link"
                      : "text-theme-primary hover:bg-theme-surface text-theme-link-hover"
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Dashboard
                </Link>

                <div className="pt-4 mt-4 border-t border-theme-primary">
                  <Link
                    to="/"
                    onClick={handleLinkClick}
                    className="flex items-center justify-center px-6 py-4 bg-theme-accent text-white rounded-lg hover:bg-theme-link-hover transition-colors font-medium text-lg shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Session
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
