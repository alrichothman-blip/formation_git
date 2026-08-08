import { useState, useCallback, useEffect } from 'react';
import { borrowings as borrowingsApi } from './lib/api';
import { useAuth } from './lib/auth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast, { ToastItem } from './components/Toast';
import LibrisAIWidget from './components/LibrisAIWidget';
import Home from './views/Home';
import Register from './views/Register';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Books from './views/Books';
import Members from './views/Members';
import Borrowings from './views/Borrowings';
import ErrorBoundary from './components/ErrorBoundary';
import Stats from './views/Stats';

const PUBLIC_VIEWS = ['home', 'register', 'login'];
const ADMIN_VIEWS = ['dashboard', 'members', 'stats'];

const VIEW_TITLES: Record<string, { title: string; subtitle: string; addLabel?: string; searchable?: boolean }> = {
  home: { title: 'Bibliothèque de l\'IST', subtitle: 'Institut Supérieur de Technologie d\'Antsiranana' },
  register: { title: 'Inscription des étudiants', subtitle: 'Formulaire d\'inscription à la bibliothèque' },
  login: { title: 'Connexion', subtitle: 'Accédez à votre espace' },
  dashboard: { title: 'Tableau de bord', subtitle: 'Vue d\'ensemble de la bibliothèque', searchable: true },
  books: { title: 'Catalogue des livres', subtitle: 'Parcourez la collection de la bibliothèque', addLabel: 'Ajouter un livre', searchable: true },
  members: { title: 'Étudiants inscrits', subtitle: 'Gérez les étudiants de la bibliothèque', addLabel: 'Inscrire un étudiant', searchable: true },
  borrowings: { title: 'Emprunts', subtitle: 'Suivez les prêts et les retours', addLabel: 'Nouvel emprunt', searchable: true },
  stats: { title: 'Statistiques', subtitle: 'Analyse et rapports détaillés' },
};

export default function App() {
  const { user, role, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [addTrigger, setAddTrigger] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [initialOpenBorrowingId, setInitialOpenBorrowingId] = useState<number | null>(null);
  const [initialMemberId, setInitialMemberId] = useState<number | null>(null);

  const isAuthenticated = !!user;
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeView]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !PUBLIC_VIEWS.includes(activeView)) {
      setActiveView('home');
    } else if (isAuthenticated && (activeView === 'login' || activeView === 'register')) {
      setActiveView('books');
    } else if (isAuthenticated && !isAdmin && ADMIN_VIEWS.includes(activeView)) {
      setActiveView('books');
    }
  }, [isAuthenticated, isAdmin, activeView, loading]);

  useEffect(() => {
    if (!isAuthenticated) { setOverdueCount(0); return; }
    async function countOverdue() {
      try {
        const data = await borrowingsApi.list();
        const today = new Date().toISOString().split('T')[0];
        setOverdueCount(data.filter((b: any) => !b.return_date && b.due_date < today).length);
      } catch { setOverdueCount(0); }
    }
    countOverdue();
  }, [isAuthenticated]);

  const showToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleNavigate = useCallback((view: string) => {
    if (view === 'logout') { signOut(); setActiveView('home'); return; }
    if (!isAuthenticated && !PUBLIC_VIEWS.includes(view)) { setActiveView('login'); return; }
    if (isAuthenticated && !isAdmin && ADMIN_VIEWS.includes(view)) { setActiveView('books'); return; }
    setActiveView(view);
  }, [isAuthenticated, isAdmin, signOut]);

  const handleOpenBorrowing = useCallback((b: any) => {
    // open borrowings view and pre-select the borrowing / member
    setInitialOpenBorrowingId(b?.id ?? null);
    setInitialMemberId(b?.members?.id ?? null);
    setActiveView('borrowings');
  }, []);

  const handleAdd = () => {
    if (activeView === 'members') { handleNavigate('register'); return; }
    if (!isAdmin) return;
    setAddTrigger(n => n + 1);
  };

  const viewConfig = VIEW_TITLES[activeView] || VIEW_TITLES.home;
  const showSidebar = isAuthenticated && !['login', 'register'].includes(activeView);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {showSidebar && (
        <Sidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
          notifications={overdueCount}
          isAdmin={isAdmin}
          onLogout={() => handleNavigate('logout')}
        />
      )}

      <main className={`transition-all duration-300 min-h-screen ${showSidebar ? (sidebarCollapsed ? 'ml-16' : 'ml-64') : ''}`}>
        <div className="p-6 lg:p-8 max-w-[1600px]">
          <Header
            title={viewConfig.title}
            subtitle={viewConfig.subtitle}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode(d => !d)}
            searchQuery={searchQuery}
            onSearch={viewConfig.searchable ? setSearchQuery : undefined}
            onOpenBorrowing={handleOpenBorrowing}
            onAdd={viewConfig.addLabel && isAdmin ? handleAdd : undefined}
            addLabel={viewConfig.addLabel}
            activeView={activeView}
          />

          {activeView === 'home' && <Home onNavigate={handleNavigate} />}
          {activeView === 'register' && <Register showToast={showToast} onNavigate={handleNavigate} />}
          {activeView === 'login' && <Login onNavigate={handleNavigate} showToast={showToast} />}
          {activeView === 'dashboard' && isAdmin && <Dashboard />}
          {activeView === 'books' && (
            <Books searchQuery={searchQuery} onAdd={handleAdd} addTrigger={addTrigger} showToast={showToast} isAdmin={isAdmin} />
          )}
          {activeView === 'members' && isAdmin && (
            <Members searchQuery={searchQuery} addTrigger={addTrigger} showToast={showToast} />
          )}
          {activeView === 'borrowings' && (
            <ErrorBoundary>
              <Borrowings
                searchQuery={searchQuery}
                addTrigger={addTrigger}
                showToast={showToast}
                isAdmin={isAdmin}
                initialMemberId={initialMemberId ?? undefined}
                initialOpenBorrowingId={initialOpenBorrowingId ?? undefined}
              />
            </ErrorBoundary>
          )}
          {activeView === 'stats' && isAdmin && <Stats />}
        </div>
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
      {!['login', 'register'].includes(activeView) && <LibrisAIWidget />}
    </div>
  );
}
