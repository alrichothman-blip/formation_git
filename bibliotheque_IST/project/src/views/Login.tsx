import { useState } from 'react';
import { Lock, Mail, ArrowLeft, BookOpen, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface LoginProps {
  onNavigate: (view: string) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function Login({ onNavigate, showToast }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) { showToast('error', 'Veuillez remplir tous les champs.'); return; }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      showToast('error', error.includes('Invalid login') ? 'E-mail ou mot de passe incorrect.' : error);
    } else {
      showToast('success', 'Connexion réussie!');
    }
  }

  const inputClass = "w-full pl-10 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white placeholder-slate-400 transition-all";

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-6">
          <ArrowLeft size={15} /> Retour à l'accueil
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-8">
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
              <BookOpen size={26} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Connexion</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bibliothèque de l'IST-D</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Adresse e-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" className={inputClass} autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={`${inputClass} pr-10`} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 rounded-xl transition-all shadow-md shadow-teal-500/30 disabled:opacity-60 flex items-center justify-center gap-2 active:scale-95">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Se connecter
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pas encore inscrit?{' '}
              <button onClick={() => onNavigate('register')} className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                S'inscrire
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
