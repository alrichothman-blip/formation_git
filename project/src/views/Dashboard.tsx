import { useEffect, useRef, useState } from 'react';
import { BookOpen, Users, BookMarked, AlertTriangle, TrendingUp, Clock, CheckCircle2, ArrowUpRight, FileText, FileSpreadsheet } from 'lucide-react';
import { dashboard as dashboardApi } from '../lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  animationCycle: number;
}

function AnimatedNumber({ value, animationCycle }: { value: number; animationCycle: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    cancelAnimationFrame(animationRef.current ?? 0);
    if (!animationCycle || value === 0) {
      setDisplayValue(value);
      return;
    }

    setDisplayValue(0);
    const startedAt = performance.now();
    // Une durée identique garde tous les compteurs parfaitement synchronisés.
    const duration = 950;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.min(value, Math.floor(eased * value)));
      if (progress < 1) animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current ?? 0);
  }, [value, animationCycle]);

  return <span className="dashboard-number-window"><span key={`${displayValue}-${animationCycle}`} className={animationCycle ? 'dashboard-number-slide' : ''}>{displayValue}</span></span>;
}

function StatCard({ label, value, icon, color, bg, trend, trendUp, animationCycle }: StatCardProps) {
  return (
    <div className="dashboard-stat-card dashboard-reveal">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
        {trend && (
          <span className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
            <ArrowUpRight size={12} className={!trendUp ? 'rotate-90' : ''} />
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-semibold text-slate-900 dark:text-white mb-1">
        <AnimatedNumber value={typeof value === 'number' ? value : Number(value)} animationCycle={animationCycle} />
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0, totalMembers: 0, activeLoans: 0, overdueLoans: 0,
    availableBooks: 0, newMembersThisMonth: 0, returnedThisMonth: 0
  });
  const [recentBorrowings, setRecentBorrowings] = useState<any[]>([]);
  const [recentBooks, setRecentBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [animationCycle, setAnimationCycle] = useState(0);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const elements = dashboardRef.current?.querySelectorAll<HTMLElement>('.dashboard-reveal');
    if (!elements?.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('is-visible'));
    }, { threshold: 0.1 });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => setAnimationCycle(cycle => cycle + 1), 380);
    return () => window.clearTimeout(timer);
  }, [loading]);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await dashboardApi.get();
      setStats(prev => ({
        totalBooks: data?.totalBooks ?? prev.totalBooks,
        totalMembers: data?.totalMembers ?? prev.totalMembers,
        activeLoans: data?.activeLoans ?? prev.activeLoans,
        overdueLoans: data?.overdueLoans ?? prev.overdueLoans,
        availableBooks: data?.availableBooks ?? prev.availableBooks,
        newMembersThisMonth: data?.newMembersThisMonth ?? prev.newMembersThisMonth,
        returnedThisMonth: data?.returnedThisMonth ?? prev.returnedThisMonth,
      }));
      setRecentBorrowings(Array.isArray(data?.recentBorrowings) ? data.recentBorrowings : []);
      setRecentBooks(Array.isArray(data?.recentBooks) ? data.recentBooks : []);
    } catch (e: any) {
      console.error('Erreur lors du chargement du dashboard', e);
    }
    setLoading(false);
  }

  const statusBadge = (status: string, dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = dueDate < today && status === 'active';
    if (isOverdue) return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100/90 text-red-700 dark:bg-red-900/30 dark:text-red-400">En retard</span>;
    if (status === 'returned') return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Retourné</span>;
    return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100/90 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">En cours</span>;
  };

  function loadImageAsDataURL(url: string): Promise<string | null> {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async function exportDashboardBorrowingsExcel() {
    try {
      const rows = [
        ['Bibliothèque IST - Rapport des emprunts récents'],
        [],
        ['ID', 'Livre', 'ISBN', 'Étudiant', 'Contact', 'Domicile', 'Parcours', 'Date emprunt', 'Date prévue', 'Date retour'],
        ...recentBorrowings.map(b => [
          b.id,
          b.books?.title || '',
          b.books?.isbn || '',
          `${b.members?.name || ''} ${b.members?.prenom || ''}`.trim(),
          b.members?.phone || '',
          b.members?.address || '',
          b.members?.parcours || '',
          b.borrow_date ? new Date(b.borrow_date).toLocaleDateString('fr-FR') : '',
          b.due_date ? new Date(b.due_date).toLocaleDateString('fr-FR') : '',
          b.return_date ? new Date(b.return_date).toLocaleDateString('fr-FR') : '',
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wpx: 28 },
        { wpx: 200 },
        { wpx: 110 },
        { wpx: 150 },
        { wpx: 110 },
        { wpx: 220 },
        { wpx: 120 },
        { wpx: 90 },
        { wpx: 90 },
        { wpx: 90 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Emprunts');
      XLSX.writeFile(wb, `emprunts_dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'export des emprunts.');
    }
  }

  async function exportDashboardBorrowingsPdf() {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const margin = 40;
      const logoDataUrl = await loadImageAsDataURL('/Sans titre.jpg');
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'JPEG', margin, margin, 55, 55);
      }
      const headerX = margin + 70;
      const headerY = margin + 18;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Bibliothèque IST', headerX, headerY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Rapport des emprunts récents', headerX, headerY + 20);
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`, headerX, headerY + 36);
      autoTable(doc, {
        startY: margin + 100,
        head: [[
          'ID',
          'Livre',
          'Étudiant',
          'Statut',
          'Date emprunt',
          'Date prévue',
          'Date retour',
        ]],
        body: recentBorrowings.map(b => [
          b.id,
          b.books?.title || '',
          `${b.members?.name || ''} ${b.members?.prenom || ''}`.trim(),
          b.status === 'active' ? 'En cours' : b.status === 'overdue' ? 'En retard' : 'Retourné',
          b.borrow_date ? new Date(b.borrow_date).toLocaleDateString('fr-FR') : '',
          b.due_date ? new Date(b.due_date).toLocaleDateString('fr-FR') : '',
          b.return_date ? new Date(b.return_date).toLocaleDateString('fr-FR') : '',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [15, 70, 57], textColor: 255, halign: 'center' },
        styles: { fontSize: 9, cellPadding: 5, valign: 'middle' },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 220 },
          2: { cellWidth: 170 },
          3: { cellWidth: 70 },
          4: { cellWidth: 90 },
          5: { cellWidth: 90 },
          6: { cellWidth: 90 },
        },
      });
      doc.save(`emprunts_dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'export PDF.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 bg-white/70 dark:bg-slate-950/70 border border-white/20 dark:border-slate-700/50 rounded-[1.75rem] p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)] backdrop-blur-xl animate-fade-in-up">
          <div className="w-11 h-11 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="dashboard-page space-y-8">
      <section className="dashboard-reveal">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total des livres"
          value={stats.totalBooks}
          icon={<BookOpen size={20} />}
          color="text-blue-700 dark:text-blue-400"
          bg="bg-slate-100 dark:bg-slate-800"
          trend={`+${stats.returnedThisMonth ?? 0} ce mois`}
          trendUp={true}
          animationCycle={animationCycle}
        />
        <StatCard
          label="Membres actifs"
          value={stats.totalMembers}
          icon={<Users size={20} />}
          color="text-slate-600 dark:text-slate-300"
          bg="bg-slate-100 dark:bg-slate-800"
          trend={`+${stats.newMembersThisMonth ?? 0} ce mois`}
          trendUp={true}
          animationCycle={animationCycle}
        />
        <StatCard
          label="Emprunts actifs"
          value={stats.activeLoans}
          icon={<BookMarked size={20} />}
          color="text-slate-700 dark:text-slate-200"
          bg="bg-slate-100 dark:bg-slate-800"
          animationCycle={animationCycle}
        />
        <StatCard
          label="En retard"
          value={stats.overdueLoans}
          icon={<AlertTriangle size={20} />}
          color="text-rose-600 dark:text-rose-400"
          bg="bg-rose-50/60 dark:bg-rose-950/30"
          animationCycle={animationCycle}
        />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 dashboard-reveal">
        <div className="dashboard-spotlight dashboard-spotlight-teal">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 size={20} className="opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Disponibles</span>
          </div>
          <div className="text-3xl font-bold mb-1"><AnimatedNumber value={stats.availableBooks} animationCycle={animationCycle} /></div>
          <div className="text-sm text-teal-100">Exemplaires disponibles</div>
        </div>

        <div className="dashboard-spotlight dashboard-spotlight-slate">
          <div className="flex items-center justify-between mb-3">
            <Clock size={20} className="opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Ce mois</span>
          </div>
          <div className="text-3xl font-bold mb-1"><AnimatedNumber value={stats.newMembersThisMonth} animationCycle={animationCycle} /></div>
          <div className="text-sm text-slate-300">Nouveaux membres</div>
        </div>

        <div className="dashboard-spotlight dashboard-spotlight-blue">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={20} className="opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Taux</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            <AnimatedNumber value={stats.totalBooks > 0 ? Math.round(((stats.totalBooks * 1 - stats.availableBooks) / (stats.totalBooks * 1 || 1)) * 100) : 0} animationCycle={animationCycle} />%
          </div>
          <div className="text-sm text-blue-100">Taux d'occupation</div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3 dashboard-reveal">
        <div className="dashboard-list-card lg:col-span-2">
          <div className="px-6 py-4 border-b border-white/20 dark:border-slate-700/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">Emprunts récents</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">{recentBorrowings.length} derniers</span>
              <button
                onClick={exportDashboardBorrowingsExcel}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-teal-50 hover:text-teal-600 transition-all"
              >
                <FileSpreadsheet size={16} />
                XLSX
              </button>
              <button
                onClick={exportDashboardBorrowingsPdf}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full border bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-teal-50 hover:text-teal-600 transition-all"
              >
                <FileText size={16} />
                PDF
              </button>
            </div>
          </div>
          <div className="divide-y divide-white/10 dark:divide-slate-700/50">
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

        <div className="dashboard-list-card">
          <div className="px-6 py-4 border-b border-white/20 dark:border-slate-700/50">
            <h3 className="font-bold text-slate-900 dark:text-white">Derniers ajouts</h3>
          </div>
          <div className="p-4 space-y-3">
            {recentBooks.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-4">Aucun livre récent</p>
            ) : (
              recentBooks.map((book: any) => (
                <div key={book.id} className="flex items-center gap-3 p-3 rounded-[1.5rem] hover:bg-slate-50/80 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group">
                  <div
                    className="w-10 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: book.categories?.color || '#3B82F6' }}
                  >
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>{book.title.charAt(0)}</span>
                    )}
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
      </section>
    </div>
  );
}
