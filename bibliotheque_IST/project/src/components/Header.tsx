import { Search, Sun, Moon, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  darkMode: boolean;
  onToggleDark: () => void;
  searchQuery?: string;
  onSearch?: (q: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function Header({
  title,
  subtitle,
  darkMode,
  onToggleDark,
  searchQuery = '',
  onSearch,
  onAdd,
  addLabel,
  onRefresh,
  refreshing
}: HeaderProps) {
  const [focused, setFocused] = useState(false);
  const showSearch = !!onSearch;

  return (
    <header className="flex items-center justify-between gap-4 mb-8 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        {showSearch && (
          <div className={`relative flex items-center transition-all duration-300 ${focused ? 'w-72' : 'w-56'}`}>
            <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearch!(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-all duration-200"
            />
          </div>
        )}

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-teal-500 hover:border-teal-400 transition-all duration-200"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        )}

        {/* Dark mode */}
        <button
          onClick={onToggleDark}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-teal-500 hover:border-teal-400 transition-all duration-200"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Add button */}
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md shadow-teal-500/30 hover:shadow-teal-500/50 active:scale-95"
          >
            <Plus size={16} />
            <span>{addLabel || 'Ajouter'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
