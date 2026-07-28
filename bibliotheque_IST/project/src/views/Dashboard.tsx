import { useEffect, useState } from 'react';
import { BookOpen, Users, BookMarked, AlertTriangle, TrendingUp, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Borrowing, Book } from '../lib/types';

interface Stats {
  totalBooks: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  availableBooks: number;
  newMembersThisMonth: number;
  returnedThisMonth: number;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ label, value, icon, color, bg, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
            <ArrowUpRight size={12} className={!trendUp ? 'rotate-90' : ''} />
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0, totalMembers: 0, activeLoans: 0, overdueLoans: 0,
    availableBooks: 0, newMembersThisMonth: 0, returnedThisMonth: 0
  });
  const [recentBorrowings, setRecentBorrowings] = useState<Borrowing[]>([]);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const [booksRes, membersRes, borrowingsRes, recentBorrowingsRes, recentBooksRes] = await Promise.all([
      supabase.from('books').select('id, available_copies'),
      supabase.from('members').select('id, created_at'),
      supabase.from('borrowings').select('id, status, due_date, return_date').is('return_date', null),
      supabase.from('borrowings').select('*, books(title, author, cover_url), members(name, email)').order('created_at', { ascending: false }).limit(8),
      supabase.from('books').select('*, categories(name, color)').order('created_at', { ascending: false }).limit(5),
    ]);

    const books = booksRes.data || [];
    const members = membersRes.data || [];
    const borrowings = borrowingsRes.data || [];
    const todayStr = now.toISOString().split('T')[0];

    const activeLoans = borrowings.filter(b => b.status !== 'returned').length;
    const overdueLoans = borrowings.filter(b => b.due_date < todayStr && !b.return_date).length;
    const newMembers = members.filter(m => m.created_at.split('T')[0] >= firstOfMonth).length;

    setStats({
      totalBooks: books.length,
      totalMembers: members.length,
      activeLoans,
      overdueLoans,
      availableBooks: books.reduce((acc: number, b: any) => acc + (b.available_copies || 0), 0),
      newMembersThisMonth: newMembers,
      returnedThisMonth: 0,
    });

    setRecentBorrowings((recentBorrowingsRes.data as any[]) || []);
    setRecentBooks((recentBooksRes.data as any[]) || []);
    setLoading(false);
  }

  const statusBadge = (status: string, dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = dueDate < today && status === 'active';
    if (isOverdue) return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">En retard</span>;
    if (status === 'returned') return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Retourné</span>;
    return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">En cours</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
          <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total des livres"
          value={stats.totalBooks}
          icon={<BookOpen size={20} />}
          color="text-teal-600 dark:text-teal-400"
          bg="bg-teal-50 dark:bg-teal-500/10"
          trend="+3 ce mois"
          trendUp={true}
        />
        <StatCard
          label="Membres actifs"
          value={stats.totalMembers}
          icon={<Users size={20} />}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-500/10"
          trend={`+${stats.newMembersThisMonth} ce mois`}
          trendUp={true}
        />
        <StatCard
          label="Emprunts actifs"
          value={stats.activeLoans}
          icon={<BookMarked size={20} />}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-50 dark:bg-amber-500/10"
        />
        <StatCard
          label="En retard"
          value={stats.overdueLoans}
          icon={<AlertTriangle size={20} />}
          color="text-red-600 dark:text-red-400"
          bg="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-teal-500/20">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 size={20} className="opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Disponibles</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.availableBooks}</div>
          <div className="text-sm text-teal-100">Exemplaires disponibles</div>
        </div>

        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Clock size={20} className="opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Ce mois</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.newMembersThisMonth}</div>
          <div className="text-sm text-slate-300">Nouveaux membres</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={20} className="opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Taux</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {stats.totalBooks > 0 ? Math.round(((stats.totalBooks * 1 - stats.availableBooks) / (stats.totalBooks * 1 || 1)) * 100) : 0}%
          </div>
          <div className="text-sm text-blue-100">Taux d'occupation</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Borrowings */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">Emprunts récents</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{recentBorrowings.length} derniers</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentBorrowings.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                Aucun emprunt récent
              </div>
            ) : (
              recentBorrowings.map((b: any) => (
                <div key={b.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={14} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{b.books?.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{b.members?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {statusBadge(b.status, b.due_date)}
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Retour: {new Date(b.due_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Books */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">Derniers ajouts</h3>
          </div>
          <div className="p-4 space-y-3">
            {recentBooks.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-4">Aucun livre récent</p>
            ) : (
              recentBooks.map((book: any) => (
                <div key={book.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group">
                  <div
                    className="w-10 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: book.categories?.color || '#3B82F6' }}
                  >
                    {book.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{book.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{book.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: (book.categories?.color || '#3B82F6') + '20', color: book.categories?.color || '#3B82F6' }}
                      >
                        {book.categories?.name || 'Sans catégorie'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-semibold ${book.available_copies > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {book.available_copies}/{book.total_copies}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
