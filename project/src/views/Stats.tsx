import { useEffect, useState } from 'react';
import { TrendingUp, BookOpen, Users, BookMarked, AlertTriangle, Award } from 'lucide-react';
import { stats as statsApi } from '../lib/api';

export default function Stats() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const d = await statsApi.get();
      setData(d);
    } catch {
      // silent
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #e2e8f0', borderTopColor: '#14b8a6' }} />
    </div>
  );

  const maxMonthly = Math.max(...(data.monthly.map((m: any) => m.count)), 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total emprunts', value: data.totalBorrowings, icon: BookMarked, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10' },
          { label: 'Membres actifs', value: `${data.activeMembers}/${data.totalMembers}`, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Taux de retour', value: `${data.returnRate}%`, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'En retard', value: data.overdueLoans, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center ${color} mb-3`}><Icon size={18} /></div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-teal-500" /> Emprunts par mois
          </h3>
          <div className="flex items-end gap-3 h-40">
            {data.monthly.map((m: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{m.count}</span>
                <div className="w-full rounded-t-lg transition-all duration-500 bg-teal-500" style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count > 0 ? '8px' : '2px', opacity: m.count === 0 ? 0.3 : 1 }} />
                <span className="text-xs text-slate-500 dark:text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <BookOpen size={16} className="text-teal-500" /> Livres par catégorie
          </h3>
          <div className="space-y-3">
            {data.booksByCategory.map((cat: any) => {
              const pct = data.totalBooks > 0 ? Math.round((cat.count / data.totalBooks) * 100) : 0;
              const availPct = cat.count > 0 ? Math.round((cat.available / cat.count) * 100) : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.count} ex.</span>
                      <span className="text-emerald-500">{availPct}% dispo.</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <Award size={16} className="text-teal-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Livres les plus empruntés</h3>
        </div>
        <div className="p-6">
          {data.topBooks.length === 0 ? (
            <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-4">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-4">
              {data.topBooks.map((book: any, i: number) => {
                const maxCount = data.topBooks[0]?.count || 1;
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-lg w-6 flex-shrink-0">{i < 3 ? medals[i] : `${i + 1}.`}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{book.title}</span>
                        <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{book.count} emprunts</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all duration-700" style={{ width: `${(book.count / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
