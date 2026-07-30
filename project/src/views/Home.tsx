import { BookOpen, GraduationCap, MapPin, Phone, Mail, Calendar, ArrowRight, Library, Wifi, Award, Users, BookMarked, Clock, LogIn } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface HomeProps {
  onNavigate: (view: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { user, role } = useAuth();
  const isAuthenticated = !!user;
  const isAdmin = role === 'admin';

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-slate-800 p-8 lg:p-14 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-teal-300 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <Library size={28} className="text-white" />
            </div>
            <div>
              <p className="text-teal-100 text-sm font-medium">Institut Supérieur de Technologie d'Antsiranana</p>
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
            Bibliothèque de l'IST
          </h1>
          <p className="text-teal-50 text-lg leading-relaxed mb-8 max-w-2xl">
            Bienvenue sur le portail de gestion de la bibliothèque de l'IST-D.
            Inscrivez-vous, consultez le catalogue et suivez les emprunts en toute simplicité.
          </p>
          <div className="flex flex-wrap gap-4">
            {!isAuthenticated && (
              <>
                <button
                  onClick={() => onNavigate('register')}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-all duration-200 shadow-lg active:scale-95"
                >
                  <GraduationCap size={18} />
                  S'inscrire en ligne
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="flex items-center gap-2 px-6 py-3 bg-white/15 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/25 transition-all duration-200 border border-white/20 active:scale-95"
                >
                  <LogIn size={18} />
                  Se connecter
                </button>
              </>
            )}
            {isAuthenticated && (
              <button
                onClick={() => onNavigate(isAdmin ? 'dashboard' : 'books')}
                className="flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-all duration-200 shadow-lg active:scale-95"
              >
                {isAdmin ? 'Accéder au tableau de bord' : 'Voir le catalogue'}
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Catalogue de livres', color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-500/10' },
          { icon: Users, label: 'Étudiants inscrits', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { icon: BookMarked, label: 'Emprunts actifs', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { icon: Clock, label: 'Suivi des retards', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10' },
        ].map(({ icon: Icon, label, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
              <Icon size={22} />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
          </div>
        ))}
      </div>

      {/* About IST-D */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-7">
          <div className="flex items-center gap-2 mb-4">
            <Award size={20} className="text-teal-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">À propos de l'IST-D</h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              L'Institut Supérieur de Technologie d'Antsiranana (IST-D) est un <strong className="text-slate-800 dark:text-white">établissement totalement public</strong>,
              troisième IST national outre IST Tanà et IST Ambositra.
            </p>
            <p>
              Les étudiants reçoivent une <strong className="text-teal-600 dark:text-teal-400">bourse complète</strong> et un équipement.
              Pas d'écolage, uniquement le droit annuel.
            </p>
            <p>
              Chaque élève bénéficie d'une <strong className="text-slate-800 dark:text-white">connexion internet haut débit</strong> dans l'enceinte de l'école.
              Tous les étudiants sont régis par des règlements intérieurs.
            </p>
            <div className="flex items-start gap-3 p-4 bg-teal-50 dark:bg-teal-500/10 rounded-xl border border-teal-100 dark:border-teal-900/30">
              <Calendar size={18} className="text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-teal-800 dark:text-teal-300">Rentrée universitaire 2025-2026</p>
                <p className="text-teal-700 dark:text-teal-400 text-xs mt-0.5">Programmée pour le 10 novembre 2025 à 8h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-7">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={20} className="text-teal-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Contact</h2>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">IST Antsiranana</p>
                <p className="text-slate-500 dark:text-slate-400">Enceinte SECREN — B.P 509</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-slate-400 flex-shrink-0" />
              <a href="tel:+261325753276" className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                +261 32 57 532 76
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-slate-400 flex-shrink-0" />
              <a href="mailto:scolariteistd@gmail.com" className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors break-all">
                scolariteistd@gmail.com
              </a>
            </div>
            <div className="flex items-start gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <Wifi size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Connexion internet haut débit disponible dans l'enceinte de l'école pour tous les étudiants.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inscription info */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-7 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap size={20} className="text-teal-400" />
          <h2 className="text-xl font-bold">Inscription et réinscription 2025-2026</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <p className="text-slate-300">
              <strong className="text-white">Règlement du droit :</strong> par voie bancaire au compte de l'IST d'Antsiranana
              (BNI Madagascar N° 00005 00016 34310620200 85) ou à la caisse.
            </p>
            <p className="text-slate-400 text-xs">
              Mention au motif : « Droit de nom de l'étudiant, parcours »
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-slate-300">
              Après l'inscription en ligne, le reçu original du paiement et une photocopie couleur légalisée du CIN
              sont à déposer au bureau de scolarité de l'IST.
            </p>
            <button
              onClick={() => onNavigate('register')}
              className="flex items-center gap-2 text-teal-400 font-semibold hover:text-teal-300 transition-colors"
            >
              Remplir le formulaire d'inscription
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
