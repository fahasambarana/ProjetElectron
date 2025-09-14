import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  TrendingUp,
  Wallet,
  Bell,
  HelpCircle,
  Moon,
  Sun,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  const menuItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    // { to: "/profile", label: "Profil", icon: User },
    { to: "/settings", label: "Paramètres", icon: Settings },
    { to: "/stocklist", label: "Liste des Stocks", icon: BarChart3 },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/edt", label: "Emploi du temps", icon: Calendar },
  ];
  const navigate = useNavigate()
  const logout =() =>{
    navigate('/login')
  }

  return (
    <aside
      className={`
        fixed lg:sticky top-0 left-0 z-30 h-screen
        bg-gradient-to-b from-blue-700 to-blue-900
        shadow-2xl transition-all duration-500 ease-in-out
        flex flex-col group/sidebar
        ${collapsed ? "w-20" : "w-72"}
        ${darkMode ? "dark" : ""}
      `}
    >
      {/* Header avec logo et bouton collapse */}
      <div className="flex items-center justify-between p-5 border-b border-blue-700">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <BarChart3 size={18} className="text-white" />
            </div>
            <div className="text-xl font-bold text-white whitespace-nowrap transition-opacity duration-300">
              Tp-Link
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto">
            <BarChart3 size={18} className="text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg bg-blue-800 text-blue-300 hover:bg-blue-700 hover:text-white transition-all shadow-md"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 relative">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`
                flex items-center rounded-xl px-4 py-3 relative group
                transition-all duration-300
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-750 hover:text-white"
                }
              `}
            >
              {/* Icône avec badge de notification si nécessaire */}
              <div className="relative">
                <Icon size={22} className="flex-shrink-0" />
                {item.label === "Notifications" && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    3
                  </span>
                )}
              </div>

              {/* Label → animé au collapse */}
              {!collapsed && (
                <span className="ml-4 font-medium transition-all duration-300 whitespace-nowrap">
                  {item.label}
                </span>
              )}

              {/* Barre indicative côté gauche si actif */}
              {isActive && (
                <span
                  className={`
                    absolute left-0 top-1/2 transform -translate-y-1/2 h-8 w-1 bg-white rounded-r
                    transition-all duration-300
                    ${collapsed ? "opacity-0" : "opacity-100"}
                  `}
                />
              )}
              
              {/* Tooltip pour mode réduit */}
              {collapsed && (
                <div
                  className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3
                    px-3 py-2 bg-gray-800 text-white rounded-lg shadow-lg opacity-0
                    group-hover:opacity-100 transition-all duration-300 text-sm font-medium
                    whitespace-nowrap pointer-events-none z-50"
                >
                  {item.label}
                  {/* Flèche du tooltip */}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-0 border-r-4 border-r-gray-800 border-t-transparent border-b-transparent"></div>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Section des paramètres */}
      <div className="px-3 py-4 border-t border-gray-700 space-y-2">
        {/* Bouton mode sombre/clair */}
       

        {/* Bouton d'aide */}
      

        {/* Bouton de déconnexion */}
        <button
          className="
            flex items-center w-full rounded-xl px-4 py-3
            text-gray-300 hover:bg-red-900/30 hover:text-red-400 transition-all
            relative group mt-4
          " onClick={logout}
        >
          <LogOut size={22} />
          {!collapsed && (
            <span className="ml-4 font-medium transition-all">Déconnexion</span>
          )}
          {collapsed && (
            <div
              className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3
                px-3 py-2 bg-red-800 text-white rounded-lg shadow-lg opacity-0
                group-hover:opacity-100 transition-all duration-300 text-sm font-medium
                whitespace-nowrap pointer-events-none z-50"
            >
              Déconnexion
              <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-0 border-r-4 border-r-red-800 border-t-transparent border-b-transparent"></div>
            </div>
          )}
        </button>
      </div>

      {/* Profile footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-700 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-center text-white font-bold">
            F
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">Fahasambarana</p>
            <p className="text-gray-400 text-sm truncate">admin@example.com</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;