import { useEffect, useRef, useState } from 'react';
import { 
  BookMarked, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  RotateCw, 
  Layers3, 
  Award, 
  ArrowUpRight
} from 'lucide-react';
import { stats as statsApi } from '../lib/api';

// Animated counter matching Dashboard.tsx
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

  return (
    <span className="dashboard-number-window">
      <span key={`${displayValue}-${animationCycle}`} className={animationCycle ? 'dashboard-number-slide' : ''}>
        {displayValue}
      </span>
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  borderColor?: string;
  trend?: string;
  trendUp?: boolean;
  animationCycle: number;
}

function StatCard({ label, value, icon, color, bg, borderColor, trend, trendUp, animationCycle }: StatCardProps) {
  return (
    <div className={`dashboard-stat-card dashboard-reveal border-l-4 ${borderColor || 'border-l-blue-600'} hover:shadow-xl transition-all duration-300 backdrop-blur-md`}>
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center ${color} shadow-sm`}>{icon}</div>
        {trend && (
          <span className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`}>
            <ArrowUpRight size={12} className={!trendUp ? 'rotate-90' : ''} />
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
        <AnimatedNumber value={typeof value === 'number' ? value : Number(value)} animationCycle={animationCycle} />
        {typeof value === 'string' && value.includes('%') ? '%' : ''}
      </div>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export default function Stats() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'6m' | '3m'>('6m');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [animationCycle, setAnimationCycle] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const elements = statsRef.current?.querySelectorAll<HTMLElement>('.dashboard-reveal');
    if (!elements?.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('is-visible'));
    }, { threshold: 0.1 });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [loading, data]);

  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => setAnimationCycle(cycle => cycle + 1), 380);
    return () => window.clearTimeout(timer);
  }, [loading]);

  async function fetchStats() {
    setLoading(true);
    try {
      const result = await statsApi.get();
      setData(result);
    } catch (err) {
      setData(null);
    }
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const result = await statsApi.get();
      setData(result);
      setAnimationCycle(c => c + 1);
    } catch (err) {
      // Keep data
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 bg-white/70 dark:bg-slate-950/70 border border-white/20 dark:border-slate-700/50 rounded-[1.75rem] p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)] backdrop-blur-xl animate-fade-in-up">
          <div className="w-11 h-11 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-slate-500 dark:text-slate-400 mb-4">Impossible de charger les statistiques.</p>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-md"
        >
          <RotateCw size={16} /> Réessayer
        </button>
      </div>
    );
  }

  // Data parsing
  const rawMonthly = Array.isArray(data.monthly) ? data.monthly : [];
  const categories = Array.isArray(data.booksByCategory) ? data.booksByCategory : [];
  const topBooks = Array.isArray(data.topBooks) ? data.topBooks : [];

  const monthly = activeTab === '3m' ? rawMonthly.slice(-3) : rawMonthly;
  const totalBorrowingSum = monthly.reduce((acc: number, m: any) => acc + (m.count || 0), 0);
  const maxMonthly = Math.max(...monthly.map((m: any) => m.count), 1);
  const peakMonth = monthly.reduce((prev: any, current: any) => (prev.count > current.count) ? prev : current, monthly[0] || { month: '-', count: 0 });

  // SVG Chart Setup
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 35;

  const points = monthly.map((m: any, index: number) => {
    const x = monthly.length > 1 
      ? paddingX + (index / (monthly.length - 1)) * (chartWidth - paddingX * 2) 
      : chartWidth / 2;
    const y = chartHeight - paddingY - ((m.count / (maxMonthly * 1.25)) * (chartHeight - paddingY * 2));
    return { x, y, month: m.month, count: m.count };
  });

  // Smooth Cubic Bézier Spline
  function getSmoothPath(pts: { x: number; y: number }[]) {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cp1x = curr.x + (next.x - curr.x) * 0.45;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) * 0.55;
      const cp2y = next.y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }
    return d;
  }

  const smoothLinePath = getSmoothPath(points);
  const smoothAreaPath = points.length 
    ? `${smoothLinePath} L ${points[points.length - 1].x},${chartHeight - paddingY + 14} L ${points[0].x},${chartHeight - paddingY + 14} Z`
    : '';

  const totalBooksCount = data.totalBooks || categories.reduce((sum: number, c: any) => sum + (c.count || 0), 0) || 1;

  // SVG Donut Chart Calculation for Category Breakdown
  let currentDonutAngle = 0;
  const donutR = 40;
  const donutC = 2 * Math.PI * donutR; // ~251.32
  const donutSegments = categories.map((cat: any) => {
    const fraction = totalBooksCount > 0 ? (cat.count / totalBooksCount) : 0;
    const strokeDasharray = `${fraction * donutC} ${donutC}`;
    const strokeDashoffset = -currentDonutAngle * donutC;
    currentDonutAngle += fraction;
    return { ...cat, fraction, strokeDasharray, strokeDashoffset };
  });

  return (
    <div ref={statsRef} className="dashboard-page space-y-8">
      {/* Top Header Bar - Coherent with Dashboard */}
      <section className="dashboard-reveal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('6m')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === '6m'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              6 mois
            </button>
            <button
              onClick={() => setActiveTab('3m')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === '3m'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              3 mois
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
            title="Actualiser les statistiques"
          >
            <RotateCw size={16} className={refreshing ? 'animate-spin text-teal-600' : ''} />
          </button>
        </div>
      </section>

      {/* KPI Cards Grid - IST Electric Blue & Crimson Red Senior Aesthetic */}
      <section className="dashboard-reveal">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total des emprunts"
            value={data.totalBorrowings}
            icon={<BookMarked size={20} />}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-50 dark:bg-blue-900/30"
            borderColor="border-l-blue-600"
            trend="+12% ce mois"
            trendUp={true}
            animationCycle={animationCycle}
          />
          <StatCard
            label="Membres actifs"
            value={data.activeMembers}
            icon={<Users size={20} />}
            color="text-sky-600 dark:text-sky-400"
            bg="bg-sky-50 dark:bg-sky-900/30"
            borderColor="border-l-sky-500"
            trend={`${data.totalMembers} au total`}
            trendUp={true}
            animationCycle={animationCycle}
          />
          <StatCard
            label="Taux de retour"
            value={data.returnRate}
            icon={<TrendingUp size={20} />}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-50 dark:bg-emerald-900/30"
            borderColor="border-l-emerald-500"
            trend="Objectif 90%"
            trendUp={true}
            animationCycle={animationCycle}
          />
          <StatCard
            label="Retards à traiter"
            value={data.overdueLoans}
            icon={<AlertTriangle size={20} />}
            color="text-rose-600 dark:text-rose-400"
            bg="bg-rose-50 dark:bg-rose-900/30"
            borderColor="border-l-rose-500"
            trend={data.overdueLoans > 0 ? "Action requise" : "Aucun retard"}
            trendUp={data.overdueLoans === 0}
            animationCycle={animationCycle}
          />
        </div>
      </section>

      {/* Main Chart + Modern Category Breakdown Grid */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3 dashboard-reveal">
        {/* Left 2 Cols: Monthly Loans Spline Chart */}
        <div className="dashboard-list-card lg:col-span-2 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 shadow-md">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Évolution des Emprunts Mensuels</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Volume de prêts enregistrés par mois</p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
              Mois pic : {peakMonth?.month} ({peakMonth?.count})
            </span>
          </div>

          <div className="p-6 relative">
            {monthly.length > 0 ? (
              <div className="relative w-full">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-auto overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.33, 0.66, 1].map((ratio, i) => {
                    const y = paddingY + ratio * (chartHeight - paddingY * 2);
                    return (
                      <line
                        key={i}
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-slate-800"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Gradient Area Fill */}
                  {smoothAreaPath && (
                    <path
                      d={smoothAreaPath}
                      fill="url(#chartGradient)"
                    />
                  )}

                  {/* Spline Line */}
                  {smoothLinePath && (
                    <path
                      d={smoothLinePath}
                      fill="none"
                      stroke="#1d4ed8"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Points */}
                  {points.map((pt: any, idx: number) => {
                    const isHovered = hoveredPointIndex === idx;
                    return (
                      <g key={pt.month} className="cursor-pointer">
                        {isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="10"
                            className="fill-blue-500/20 stroke-blue-500 stroke-1 animate-pulse"
                          />
                        )}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 5 : 4}
                          className="fill-blue-600 stroke-2 stroke-white dark:stroke-slate-900 transition-all duration-200"
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip Overlay */}
                {hoveredPointIndex !== null && points[hoveredPointIndex] && (
                  <div
                    className="absolute z-20 pointer-events-none rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold shadow-xl border border-slate-700 backdrop-blur-md transform -translate-x-1/2 -translate-y-11"
                    style={{
                      left: `${(points[hoveredPointIndex].x / chartWidth) * 100}%`,
                      top: `${(points[hoveredPointIndex].y / chartHeight) * 100}%`,
                    }}
                  >
                    <span>{points[hoveredPointIndex].month} : </span>
                    <strong className="text-blue-400 font-bold">{points[hoveredPointIndex].count} prêts</strong>
                  </div>
                )}

                {/* X Labels */}
                <div className="flex justify-between px-6 mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {monthly.map((m: any) => (
                    <span key={m.month}>{m.month}</span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-slate-400 py-8">Aucune donnée mensuelle disponible</p>
            )}
          </div>

          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Total sur la période sélectionnée : <strong className="text-slate-900 dark:text-white font-bold">{totalBorrowingSum} prêts</strong></span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <TrendingUp size={14} /> Progression régulière
            </span>
          </div>
        </div>

        {/* Right 1 Col: Modernized Category Card with SVG Donut Chart */}
        <div className="dashboard-list-card flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 shadow-md">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Répartition par Catégorie</h3>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Layers3 size={18} />
            </div>
          </div>

          <div className="p-6">
            {categories.length > 0 ? (
              <div className="space-y-6">
                {/* Modern Donut Graph + Total in Center */}
                <div className="relative flex items-center justify-center">
                  <svg className="w-36 h-36 -rotate-90 transform overflow-visible" viewBox="0 0 100 100">
                    {donutSegments.map((seg: any) => (
                      <circle
                        key={seg.name}
                        cx="50"
                        cy="50"
                        r={donutR}
                        fill="transparent"
                        stroke={seg.color || '#0d9488'}
                        strokeWidth="12"
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        className="transition-all duration-700 hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.totalBooks || 0}</span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Livres</span>
                  </div>
                </div>

                {/* Categories Progress Bars */}
                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {categories.map((cat: any) => {
                    const percent = totalBooksCount ? Math.round((cat.count / totalBooksCount) * 100) : 0;
                    const catColor = cat.color || '#0d9488';

                    return (
                      <div key={cat.name} className="space-y-1 group">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }} />
                            <span className="truncate max-w-[120px]">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-slate-900 dark:text-white">{cat.count}</span>
                            <span className="text-slate-400 font-normal text-[11px]">({percent}%)</span>
                          </div>
                        </div>

                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${percent}%`, backgroundColor: catColor }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{cat.available} disponibles</span>
                          <span>{cat.count - cat.available} en prêt</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-slate-400 py-8">Aucune catégorie répertoriée</p>
            )}
          </div>

          <div className="px-6 py-3 border-t border-white/10 dark:border-slate-700/50 flex justify-between text-xs text-slate-400">
            <span>Variété du catalogue</span>
            <strong className="text-slate-900 dark:text-white font-bold">{categories.length} catégories</strong>
          </div>
        </div>
      </section>

      {/* Bottom Leaderboard Section */}
      <section className="dashboard-reveal">
        <div className="dashboard-list-card border border-slate-200/80 dark:border-slate-800 shadow-md">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Award size={18} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Livres les plus demandés</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Palmarès des lectures</span>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topBooks.length > 0 ? (
              topBooks.slice(0, 6).map((book: any, idx: number) => {
                const maxCount = topBooks[0]?.count || 1;
                const ratio = Math.round((book.count / maxCount) * 100);

                return (
                  <div
                    key={`${book.title}-${idx}`}
                    className="flex items-center gap-3.5 p-3 rounded-[1.25rem] border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all hover:shadow-md group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 ${
                        idx === 0
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                          : idx === 1
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white'
                          : idx === 2
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      0{idx + 1}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {book.title}
                        </p>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                          {book.count} prêts
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-700"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-sm text-slate-400 py-6 col-span-full">Aucun livre emprunté pour le moment</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
