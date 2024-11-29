import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  BarChart3, 
  Bell, 
  Settings,
  History,
  LogOut
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { signOut } from '../store/slices/authSlice';
import type { AppDispatch } from '../store';

const Sidebar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const navItems = [
    { to: '/customers', icon: Users, label: 'Clienti' },
    { to: '/payments', icon: CreditCard, label: 'Pagamenti' },
    { to: '/reports', icon: BarChart3, label: 'Report' },
    { to: '/notifications', icon: Bell, label: 'Notifiche' },
    { to: '/activity', icon: History, label: 'Registro Attività' },
    { to: '/settings', icon: Settings, label: 'Impostazioni' },
  ];

  const handleLogout = async () => {
    try {
      await dispatch(signOut()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="h-screen w-64 bg-gray-900 text-white fixed left-0 top-0">
      <div className="p-4">
        <div className="mb-8">
          <img 
            src="https://i.ibb.co/Cw2DG28/01.png" 
            alt="Logo" 
            className="h-12 w-auto mx-auto mb-2"
          />
          <h1 className="text-xl font-bold text-center">Sistema Gestionale</h1>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;