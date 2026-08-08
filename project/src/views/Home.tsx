import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  GraduationCap,
  LogIn,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { books as booksApi } from '../lib/api';

interface HomeProps {
  onNavigate: (view: string) => void;
}

const HOME_SLIDES = [
  '/1.png',
  '/2.jpg',
  '/3.jpg',
];

const HIGHLIGHTS = [
  { icon: BookOpen, value: '+2 500 Ouvrages', label: 'Ressources techniques & scientifiques', tone: 'blue', tag: 'Catalogue' },
  { icon: Users, value: '1 200+ Membres', label: 'Étudiants & enseignants connectés', tone: 'red', tag: 'Communauté' },
  { icon: BookMarked, value: '2 Livres Max', label: 'Gestion optimisée des emprunts', tone: 'navy', tag: 'Service' },
  { icon: Wifi, value: 'Campus SECREN', label: 'Accès haut débit & espaces d’étude', tone: 'dark', tag: 'Infrastructure' },
];

export default function Home({ onNavigate }: HomeProps) {
  const { user, role } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const [dbBooks, setDbBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = !!user;
  const isAdmin = role === 'admin';

  useEffect(() => {
    booksApi.list()
      .then((res) => {
        setDbBooks(Array.isArray(res) ? res.slice(0, 4) : []);
      })
      .catch(() => setDbBooks([]))
      .finally(() => setLoadingBooks(false));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide(current => (current + 1) % HOME_SLIDES.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const elements = pageRef.current?.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!elements?.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.12 },
    );
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const previousSlide = () => setActiveSlide(current => (current - 1 + HOME_SLIDES.length) % HOME_SLIDES.length);
  const nextSlide = () => setActiveSlide(current => (current + 1) % HOME_SLIDES.length);

  return (
    <div ref={pageRef} className="home-page space-y-16 lg:space-y-24 pb-8">
      {/* ============================================================ */}
      {/* HERO SECTION - DRIBBLE SENIOR DESIGN                          */}
      {/* ============================================================ */}
      <section className="home-hero home-reveal is-visible relative overflow-hidden rounded-[2.5rem] text-white" aria-label="Présentation de la bibliothèque IST-D">
        <div className="home-image-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }} aria-hidden="true">
          {HOME_SLIDES.map(image => (
            <div className="home-image-panel" key={image}>
              <img className="home-image-slide" src={image} alt="Ambiance Bibliothèque IST Antsiranana" />
            </div>
          ))}
        </div>
        <div className="home-image-overlay" aria-hidden="true" />
        <div className="home-hero-orbit home-hero-orbit-one" aria-hidden="true" />
        <div className="home-hero-orbit home-hero-orbit-two" aria-hidden="true" />

        <div className="relative z-10 flex min-h-[580px] flex-col justify-between p-6 sm:p-10 lg:p-14">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="home-hero-logo">
                <img src="/Sans titre.jpg" alt="Logo Officiel IST Antsiranana" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">IST Antsiranana</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                  <span className="text-[11px] font-semibold text-rose-300 italic">les filières pour l'@venir</span>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-white/90">Bibliothèque Universitaire & Numérique</p>
              </div>
            </div>
            <span className="home-live-pill">
              <span /> Enceinte SECREN · Antsiranana
            </span>
          </div>

          {/* Main Hero Headline & CTA */}
          <div className="max-w-3xl py-10 lg:py-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-bold text-blue-200 mb-6 shadow-inner">
              <Sparkles size={14} className="text-blue-400 animate-pulse" />
              <span>Gestion & Consultation de Bibliothèque IST-D</span>
            </div>

            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Catalogue & Suivi<br />
              <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-teal-200 bg-clip-text text-transparent italic font-serif">
                des Emprunts de Livres.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg font-medium">
              Recherchez des ouvrages par titre, auteur ou discipline, réservez vos lectures et gérez l'ensemble de vos prêts en ligne au sein de la bibliothèque de l'IST Antsiranana.
            </p>

            {/* Action Buttons */}
            <div className="mt-9 flex flex-wrap gap-4">
              {!isAuthenticated ? (
                <>
                  <button onClick={() => onNavigate('register')} className="home-primary-button group">
                    <GraduationCap size={20} />
                    <span>Créer mon accès</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => onNavigate('login')} className="home-secondary-button group">
                    <LogIn size={20} />
                    <span>Se connecter</span>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => onNavigate(isAdmin ? 'dashboard' : 'books')} className="home-primary-button group">
                    <Compass size={20} />
                    <span>{isAdmin ? 'Accéder au Tableau de Bord' : 'Explorer le Catalogue'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => onNavigate('borrowings')} className="home-ghost-button">
                    <BookMarked size={19} />
                    <span>Mes Emprunts</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex flex-wrap items-end justify-between gap-5 border-t border-white/15 pt-5">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
              <p className="text-xs font-medium text-slate-300">Service d'emprunt ouvert · Du Lundi au Vendredi</p>
            </div>
            <div className="home-image-controls">
              <button className="home-image-arrow" onClick={previousSlide} aria-label="Image précédente">
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-2">
                {HOME_SLIDES.map((image, index) => (
                  <button
                    key={image}
                    className={`home-image-dot ${index === activeSlide ? 'is-active' : ''}`}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Afficher l'image ${index + 1}`}
                  />
                ))}
              </div>
              <button className="home-image-arrow" onClick={nextSlide} aria-label="Image suivante">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* STATS & METRICS ROW                                          */}
      {/* ============================================================ */}
      <section data-reveal className="home-reveal">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, value, label, tone, tag }, index) => (
            <article
              key={label}
              className={`home-highlight home-highlight-${tone} group`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="home-highlight-icon shadow-sm group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {tag}
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
              <span className="home-highlight-number">0{index + 1}</span>
            </article>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURED BOOKS CATALOG TEASER (SENIOR DRIBBBLE CARD GRID)     */}
      {/* ============================================================ */}
      <section data-reveal className="home-reveal space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <p className="home-eyebrow">Sélection d'ouvrages</p>
            <h2 className="home-section-title">Aperçu du Catalogue IST-D</h2>
          </div>
          <button
            onClick={() => onNavigate('books')}
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors group"
          >
            <span>Voir tout le catalogue</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loadingBooks ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 animate-pulse h-64" />
            ))}
          </div>
        ) : dbBooks.length === 0 ? (
          <div className="text-center py-10 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <BookOpen size={36} className="mx-auto text-blue-500 mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Aucun livre enregistré dans la base de données pour le moment.</p>
            <button onClick={() => onNavigate('books')} className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Accéder au catalogue complet →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dbBooks.map((book: any) => (
              <div
                key={book.id}
                onClick={() => onNavigate('books')}
                className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full rounded-xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-900 shadow-inner flex items-center justify-center">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-3xl font-extrabold"
                        style={{ backgroundColor: book.categories?.color || '#1d4ed8' }}
                      >
                        {book.title?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className="text-[11px] font-extrabold px-2.5 py-1 rounded-full text-white shadow-md backdrop-blur-md"
                        style={{ backgroundColor: book.categories?.color || '#1d4ed8' }}
                      >
                        {book.categories?.name || 'Général'}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {book.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{book.author}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                  <span className={`text-xs font-semibold flex items-center gap-1 ${book.available_copies > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    <CheckCircle2 size={13} /> {book.available_copies > 0 ? `${book.available_copies} dispo.` : 'Épuisé'}
                  </span>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                    Consulter →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* BENTO GRID ABOUT & LOCATION                                  */}
      {/* ============================================================ */}
      <section data-reveal className="home-reveal grid items-stretch gap-6 lg:grid-cols-5">
        {/* Story / About IST Card */}
        <article className="home-story-card lg:col-span-3">
          <div className="home-story-content">
            <p className="home-eyebrow">Institut Supérieur de Technologie</p>
            <h2 className="home-section-title max-w-lg">Un espace moderne dédié à la réussite de chaque étudiant.</h2>
            <div className="mt-6 max-w-xl space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                L’Institut Supérieur de Technologie d’Antsiranana prépare des diplômés hautement qualifiés dans les filières d'ingénierie, de technologie et de gestion.
              </p>
              <p>
                Notre bibliothèque offre une plateforme d'emprunt numérisée, des ouvrages de référence mis à jour et un espace propice au travail individuel ou collaboratif.
              </p>
            </div>
            <div className="home-date-card">
              <Calendar size={19} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-bold">Année Universitaire 2025–2026</p>
                <span>Plateforme d'emprunt en ligne active et opérationnelle</span>
              </div>
            </div>
          </div>
          <div className="home-story-art" aria-hidden="true">
            <span className="home-art-mark">IST<br />D</span>
            <BookOpen className="home-art-icon" size={110} strokeWidth={0.8} />
          </div>
        </article>

        {/* Location & Contact Card */}
        <aside className="home-contact-card lg:col-span-2 justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-400 block mb-2">Campus SECREN</span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Nous Contacter</h2>
            <p className="text-xs text-slate-400 mt-1">N'hésitez pas à solliciter l'équipe de scolarité et de gestion.</p>
          </div>

          <div className="my-6 space-y-4 text-sm">
            <div className="home-contact-line">
              <MapPin size={20} className="text-blue-400" />
              <span>Enceinte SECREN<br /><strong className="text-white">B.P. 509, Antsiranana, Madagascar</strong></span>
            </div>
            <a className="home-contact-line" href="tel:+261325753276">
              <Phone size={20} className="text-rose-400" />
              <span>+261 32 57 532 76</span>
            </a>
            <a className="home-contact-line break-all" href="mailto:scolariteistd@gmail.com">
              <Mail size={20} className="text-sky-400" />
              <span>scolariteistd@gmail.com</span>
            </a>
          </div>

          <div className="border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-400">
            Une connexion Internet haut débit est disponible dans l'enceinte de l'établissement pour tous les étudiants inscrits.
          </div>
        </aside>
      </section>

      {/* ============================================================ */}
      {/* REGISTRATION CTA BANNER                                       */}
      {/* ============================================================ */}
      <section data-reveal className="home-reveal home-registration-card">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-extrabold text-blue-200 mb-3">
              <ShieldCheck size={14} className="text-emerald-300" /> Inscription Ouverte 2025–2026
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Prêt à rejoindre la bibliothèque de l'IST-D ?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200">
              Inscrivez-vous en ligne, déposez votre reçu de paiement et votre photocopie légalisée de CIN auprès de la scolarité pour activer immédiatement votre compte.
            </p>
          </div>

          <div className="lg:justify-self-end text-center lg:text-right">
            {!isAuthenticated ? (
              <button onClick={() => onNavigate('register')} className="home-registration-button w-full sm:w-auto">
                <span>Démarrer mon inscription</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <button onClick={() => onNavigate('books')} className="home-registration-button w-full sm:w-auto">
                <span>Accéder au Catalogue</span>
                <ArrowRight size={18} />
              </button>
            )}
            <p className="mt-3 text-xs text-slate-300">
              Le règlement du droit s'effectue par voie bancaire ou à la caisse de l'IST.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
