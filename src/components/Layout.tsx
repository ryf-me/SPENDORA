import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import {
  Home,
  CreditCard,
  Settings,
  LogOut,
  Users,
  History,
  Calendar as CalendarIcon,
  Bot,
  Menu,
  X,
  Sun,
  Moon,
  Info,
  LifeBuoy,
  MessageCircle,
  FileText,
} from "lucide-react";

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = theme === "dark";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/expenses", icon: CreditCard, label: "Expenses" },
    { to: "/debtors", icon: Users, label: "Debtors" },
    { to: "/history", icon: History, label: "History" },
    { to: "/calendar", icon: CalendarIcon, label: "Calendar" },
    { to: "/ai-assistant", icon: Bot, label: "AI Assistant" },
    { to: "/reports", icon: FileText, label: "Reports" },
    { to: "/settings", icon: Settings, label: "Settings" },
    { to: "/about", icon: Info, label: "About Us" },
    { to: "/contact", icon: LifeBuoy, label: "Contact" },
    { to: "/feedback", icon: MessageCircle, label: "Feedback" },
  ];

  return (
    <div
      className="flex h-screen font-sans overflow-hidden transition-colors duration-300"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Mobile Header */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 border-b transition-colors duration-300"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center">
          <span className="font-bold text-xl tracking-wider" style={{ color: "var(--accent)" }}>
            SPEND
          </span>
          <span className="font-bold text-xl tracking-wider" style={{ color: "var(--text-primary)" }}>
            ORA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Toggle theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: "var(--text-secondary)" }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40 w-64 flex flex-col justify-between border-r transform transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? "translate-x-0 pt-16" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div className="overflow-y-auto flex-1">
          {/* User Profile */}
          <div className="p-8 flex flex-col items-center">
            <img
              src={
                currentUser?.photoURL ||
                `https://ui-avatars.com/api/?name=${currentUser?.email}&background=random`
              }
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover mb-4 border-2"
              style={{ borderColor: "var(--accent)" }}
            />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              {currentUser?.displayName ||
                currentUser?.email?.split("@")[0] ||
                "User"}
            </h2>
          </div>

          {/* Navigation */}
          <nav className="px-4 space-y-2 pb-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${isActive ? "active-nav-item" : "inactive-nav-item"
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                      background: "var(--bg-elevated)",
                      color: "var(--accent)",
                      border: "1px solid var(--border)",
                    }
                    : {
                      color: "var(--text-muted)",
                    }
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div
          className="p-4 border-t transition-colors duration-300"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl transition-colors text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            <LogOut size={20} />
            <span>Log out</span>
          </button>

          {/* Theme Toggle + Logo */}
          <div className="mt-4 mb-2 hidden md:flex items-center justify-between px-2">
            <div className="flex items-center">
              <span className="font-bold text-lg tracking-wider" style={{ color: "var(--accent)" }}>
                SPEND
              </span>
              <span className="font-bold text-lg tracking-wider" style={{ color: "var(--text-primary)" }}>
                ORA
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl transition-all duration-300"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 w-full transition-colors duration-300"
        style={{ background: "var(--bg-base)" }}
      >
        <Outlet />
      </main>
    </div>
  );
}
