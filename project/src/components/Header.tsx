import { Search, Sun, Moon, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { borrowings as borrowingsApi } from '../lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  darkMode: boolean;
  onToggleDark: () => void;
  searchQuery?: string;
  onSearch?: (q: string) => void;
  onOpenBorrowing?: (b: any) => void;
  onAdd?: () => void;
  addLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  activeView?: string;
}

export default function Header({
  title,
  subtitle,
  darkMode,
  onToggleDark,
  searchQuery = '',
  onSearch,
  onOpenBorrowing,
  onAdd,
  addLabel,
  onRefresh,
  refreshing,
  activeView
}: HeaderProps) {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const showSearch = !!onSearch;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 mb-8 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        {showSearch && (
          <div ref={containerRef} className={`relative transition-all duration-300 ${focused ? 'w-72' : 'w-56'}`}>
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => {
                  onSearch!(e.target.value);
                  // prepare suggestions
                  if (e.target.value.trim()) {
                    borrowingsApi.list().then((list) => {
                      const q = e.target.value.toLowerCase();
                      let matches = (Array.isArray(list) ? list : []).filter((b: any) =>
                        (b.books?.title || '').toLowerCase().includes(q) ||
                        (b.members?.name || '').toLowerCase().includes(q) ||
                        (b.members?.prenom || '').toLowerCase().includes(q)
                      );
                      if (activeView === 'dashboard') {
                        matches = matches.filter((b: any) => !b.return_date && b.status !== 'returned');
                      }
                      setSuggestions(matches.slice(0, 6));
                      setShowSuggestions(true);
                    }).catch(() => { setSuggestions([]); setShowSuggestions(false); });
                  } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => { setFocused(true); if (searchQuery.trim()) setShowSuggestions(true); }}
                onBlur={() => setFocused(false)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-all duration-200"
              />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    onMouseDown={(e) => { e.preventDefault(); /* keep focus behavior */ }}
                    onClick={() => {
                      if (onOpenBorrowing) onOpenBorrowing(s);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-b last:border-0"
                  >
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{s.books?.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{s.members?.name} {s.members?.prenom} · {new Date(s.borrow_date).toLocaleDateString('fr-FR')}</div>
                  </button>
                ))}
              </div>
            )}
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
