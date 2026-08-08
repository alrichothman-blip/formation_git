import { BookOpen, LayoutDashboard, Users, BookMarked, ChevronLeft, ChevronRight, BarChart3, Bell, Home, LogOut, BookText } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  notifications: number;
  isAdmin: boolean;
  onLogout: () => void;
}

export default function Sidebar({ activeView, onNavigate, collapsed, onToggle, notifications, isAdmin, onLogout }: SidebarProps) {
  const navItems = isAdmin
    ? [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'books', label: 'Livres', icon: BookOpen },
        { id: 'members', label: 'Étudiants', icon: Users },
        { id: 'borrowings', label: 'Emprunts', icon: BookMarked },
        { id: 'stats', label: 'Statistiques', icon: BarChart3 },
      ]
    : [
        { id: 'books', label: 'Catalogue', icon: BookOpen },
        { id: 'borrowings', label: 'Historique', icon: BookText },
      ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#080b12] text-white flex flex-col transition-all duration-300 z-40 shadow-[12px_0_40px_-24px_rgba(0,0,0,.7)] ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/60 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 bg-white rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
          <img src="/Sans titre.jpg" alt="Logo bibliothèque" className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Bibliothèque</h1>
            <p className="text-xs text-slate-400">de l'IST</p>
          </div>
        )}
      </div>

      {/* User role badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-700/60">
          <div className={`flex items-center gap-2 text-xs font-semibold ${isAdmin ? 'text-amber-400' : 'text-teal-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-teal-400'}`} />
            {isAdmin ? 'Administrateur' : 'Étudiant'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            title={collapsed ? label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
              activeView === id
                ? 'bg-blue-500/15 text-blue-300 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon size={18} className={`flex-shrink-0 ${activeView === id ? 'text-teal-400' : ''}`} />
            {!collapsed && <span>{label}</span>}
            {activeView === id && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-500 rounded-r-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-4 space-y-1 border-t border-slate-700/60 pt-3">
        <button
          onClick={() => onNavigate('home')}
          title={collapsed ? 'Accueil' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeView === 'home'
              ? 'bg-blue-500/15 text-blue-300'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Home size={18} className="flex-shrink-0" />
          {!collapsed && <span>Accueil</span>}
        </button>

        {notifications > 0 && (
          <button
            onClick={() => onNavigate('borrowings')}
            title={collapsed ? 'Notifications' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 relative"
          >
            <div className="relative flex-shrink-0">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {notifications}
              </span>
            </div>
            {!collapsed && <span>Retards ({notifications})</span>}
          </button>
        )}

        <button
          onClick={onLogout}
          title={collapsed ? 'Déconnexion' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-200 shadow-md z-50"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
