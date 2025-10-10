import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useContext";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Bell,
  Calendar,
  Package,
  Users,
  Home,
  Moon,
  Sun,
  User,
  Mail
} from "lucide-react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const displayName = user?.username || user?.email || "Utilisateur";

  const menuItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { to: "/stocklist", label: "Liste des Stocks", icon: Package, badge: null },
    { to: "/emprunt", label: "Emprunts", icon: Users, badge: "5" },
    { to: "/edt", label: "Emploi du temps", icon: Calendar, badge: null },
    { to: "/notifications", label: "Notifications", icon: Bell, badge: "3" },
    { to: "/settings", label: "Paramètres", icon: Settings, badge: null },
  ];

  const confirmLogout = () => setShowLogoutModal(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const cancelLogout = () => setShowLogoutModal(false);

  return (
    <>
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-30 h-screen
          bg-gradient-to-b from-slate-800 to-slate-900
          shadow-2xl border-r border-white/10
          transition-all duration-300 ease-in-out
          flex flex-col
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Header avec logo et bouton collapse */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!collapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Home size={20} className="text-white" />
              </div>
              <div className="flex flex-col">
                <div className="text-lg font-bold text-white">Tp-Link</div>
                <div className="text-xs text-white/60">Gestion de Stock</div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg mx-auto">
              <Home size={20} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200 shadow-md"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`
                  flex items-center rounded-xl px-3 py-3 relative group
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-white/10 text-white shadow-md border border-white/20"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }
                `}
                onMouseEnter={() => setActiveTooltip(item.label)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <div className="relative">
                  <Icon 
                    size={20} 
                    className={`flex-shrink-0 ${isActive ? "text-blue-400" : ""}`}
                  />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                
                {!collapsed && (
                  <span className="ml-3 font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                
                {isActive && !collapsed && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  </div>
                )}
                
                {collapsed && activeTooltip === item.label && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2
                    px-2 py-1 bg-slate-800 text-white rounded-md shadow-lg
                    text-sm font-medium whitespace-nowrap pointer-events-none z-50 
                    border border-white/10">
                    {item.label}
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 
                      border-t-2 border-b-2 border-l-0 border-r-2 border-r-slate-800 border-t-transparent border-b-transparent" />
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Section utilisateur et paramètres */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {/* Toggle Dark Mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center w-full rounded-xl px-3 py-2
              text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && (
              <span className="ml-3 text-sm font-medium">
                {darkMode ? "Mode clair" : "Mode sombre"}
              </span>
            )}
          </button>

          {/* Profile Section */}
          {!collapsed ? (
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{displayName}</p>
                  <p className="text-white/60 text-xs truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          {/* Bouton déconnexion */}
          <button
            onClick={confirmLogout}
            className="
              flex items-center w-full rounded-xl px-3 py-2
              text-white/70 hover:bg-red-500/20 hover:text-red-300 
              transition-all duration-200
            "
          >
            <LogOut size={18} />
            {!collapsed && (
              <span className="ml-3 text-sm font-medium">Déconnexion</span>
            )}
          </button>
        </div>
      </aside>

      {/* Modal de confirmation déconnexion */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl max-w-sm w-full mx-4 p-6 shadow-2xl border border-white/10">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <LogOut size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Déconnexion
              </h2>
              <p className="text-white/70 text-sm">
                Voulez-vous vraiment vous déconnecter ?
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;