import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { createMemberProfile } from '../lib/memberStorage';
import { User, GraduationCap, FileText, Users, Heart, CreditCard, Upload, CheckCircle, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';

interface RegisterProps {
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onNavigate: (view: string) => void;
}

const PARCOURS_OPTIONS = [
  'ADR (Administration des Réseaux)', 'AF (Administration Foncière)', 'AGRI3 (Agriculture)',
  'CCA (Comptabilité, Contrôle et Audit)', 'CCI (Construction Civile et Infrastructures)',
  'CGC (Conseil et Gestion de Clientèle)', 'DPT (Développement des Produits Touristiques)',
  'EGR (Eau et Génie Rural)', 'GEH (Gestion des Etablissements d\'Hébergement)',
  'GMP (Gestion Maritime et Portuaire)', 'IAA3 (Industrie Agro-Alimentaire)',
  'IRM (Ingénierie des Réseaux Mobiles)', 'MAM (Maintenance Auto-Moto)',
  'MCD (Marketing, Commerce et Distribution)', 'MEITE (Maintenance et Exploitation des installations de Traitement d\'Eau)',
  'MINES-EM (Mines, Option : Exploitation des Minérais)', 'MURE (Maintenance des Usines et des Réseaux d\'Eau)',
  'PAn3 (Production Animale)', 'SERA (Systèmes à Énergies Renouvelables et Alternatives)',
  'SHAq (Sciences halieutiques et Aquacole)', 'TAN (Technologie d\'Architecture Navale)',
  'TCI (Transit et Commerce Internationale)', 'TOPO (Topographie et Administration Foncière)',
];

const MENTIONS = ['Passable', 'Assez-bien', 'Bien', 'Très-bien'];
const DIPLOMES = ['DTS', 'Bacc+2', 'DTSS', 'Bacc+3', 'Licence'];
const BACC_TYPES = ['Technique', 'Enseignement général'];
const BACC_SERIES = ['A1', 'A2', 'C', 'D', 'L', 'OSE', 'S', 'Technique Génie civil', 'Technique Industriel', 'Technique Tertiaire', 'Technique Agricole', 'Technologique'];
const NATIONALITES = ['Malagasy', 'Comorien', 'Africain', 'Européen', 'Asiatique', 'Mauricien'];
const GROUPES_SANGUIN = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Inconnu'];

const emptyForm = {
  photo_url: '', annee_universitaire: '2025-2026', parcours: '', annee_etude: '3ème année',
  statut_etudiant: 'Admis', name: '', prenom: '', date_naissance: '', lieu_naissance: '',
  address: '', phone: '', telephone2: '', email: '', password: '', confirmPassword: '', sexe: 'Masculin', nationalite: 'Malagasy',
  cin_numero: '', cin_date: '', cin_lieu: '',
  bacc_serie_type: 'Enseignement général', bacc_serie: '', bacc_mention: 'Passable', bacc_lieu: '', bacc_annee: '',
  dernier_diplome: 'DTSS', diplome_mention: 'Passable', diplome_lieu: '', diplome_annee: '', type_formation: 'Présentiel', diplome_parcours: '',
  pere_nom: '', pere_profession: '', mere_nom: '', mere_profession: '', parent_adresse: '', parent_contact: '',
  contact_urgence_nom: '', contact_urgence_tel: '', groupe_sanguin: 'Inconnu', renseignements_complementaires: '',
  receipt_no: '', receipt_date: '', receipt_amount: '',
};

type FormState = typeof emptyForm;

export default function Register({ showToast, onNavigate }: RegisterProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (field: keyof FormState, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  async function handleSubmit() {
    if (!form.name.trim() || !form.prenom.trim()) { showToast('error', 'Le nom et les prénoms sont obligatoires.'); return; }
    if (!form.email.trim()) { showToast('error', 'L\'adresse e-mail est obligatoire.'); return; }
    if (!form.parcours) { showToast('error', 'Veuillez choisir votre parcours.'); return; }
    if (form.password.length < 6) { showToast('error', 'Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (form.password !== form.confirmPassword) { showToast('error', 'Les mots de passe ne correspondent pas.'); return; }

    setSaving(true);

    // 1. Create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    });

    if (authError) {
      setSaving(false);
      showToast('error', authError.message.includes('already') ? 'Cet e-mail est déjà inscrit. Connectez-vous.' : 'Erreur: ' + authError.message);
      return;
    }

    const userId = authData.user?.id;

    // 2. Insert member record with user_id
    const payload = {
      photo_url: form.photo_url, annee_universitaire: form.annee_universitaire, parcours: form.parcours, annee_etude: form.annee_etude,
      statut_etudiant: form.statut_etudiant, name: form.name.trim(), prenom: form.prenom.trim(),
      date_naissance: form.date_naissance || null, lieu_naissance: form.lieu_naissance,
      address: form.address, phone: form.phone, telephone2: form.telephone2, email: form.email.trim(),
      sexe: form.sexe, nationalite: form.nationalite,
      cin_numero: form.cin_numero, cin_date: form.cin_date || null, cin_lieu: form.cin_lieu,
      bacc_serie: form.bacc_serie, bacc_mention: form.bacc_mention, bacc_lieu: form.bacc_lieu,
      bacc_annee: form.bacc_annee ? parseInt(form.bacc_annee) : null,
      dernier_diplome: form.dernier_diplome, diplome_mention: form.diplome_mention, diplome_lieu: form.diplome_lieu,
      diplome_annee: form.diplome_annee ? parseInt(form.diplome_annee) : null,
      type_formation: form.type_formation, diplome_parcours: form.diplome_parcours,
      pere_nom: form.pere_nom, pere_profession: form.pere_profession, mere_nom: form.mere_nom, mere_profession: form.mere_profession,
      parent_adresse: form.parent_adresse, parent_contact: form.parent_contact,
      contact_urgence_nom: form.contact_urgence_nom, contact_urgence_tel: form.contact_urgence_tel,
      groupe_sanguin: form.groupe_sanguin, renseignements_complementaires: form.renseignements_complementaires,
      receipt_no: form.receipt_no, receipt_date: form.receipt_date || null,
      receipt_amount: form.receipt_amount ? parseFloat(form.receipt_amount) : 0,
      status: 'active', role: 'student', user_id: userId,
      membership_date: new Date().toISOString().split('T')[0],
      membership_expiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    };

    const { error: memberError } = await createMemberProfile(payload);

    setSaving(false);
    if (memberError) {
      showToast('error', 'Compte créé mais erreur lors de l\'enregistrement du profil: ' + memberError.message);
    } else {
      showToast('success', 'Inscription réussie! Vous pouvez maintenant vous connecter.');
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-5">
          <CheckCircle size={40} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Inscription enregistrée!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          Votre inscription à la bibliothèque de l'IST-D a été enregistrée avec succès.
          Connectez-vous avec votre e-mail et mot de passe pour accéder au catalogue.
        </p>
        <div className="flex gap-3">
          <button onClick={() => onNavigate('login')} className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-teal-500/30">
            Se connecter
          </button>
          <button onClick={() => { setForm(emptyForm); setSubmitted(false); }} className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
            Nouvelle inscription
          </button>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white placeholder-slate-400 transition-all";
  const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";
  const sectionClass = "bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => onNavigate('home')} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-2">
            <ArrowLeft size={15} /> Retour à l'accueil
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Inscription à la bibliothèque</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Institut Supérieur de Technologie d'Antsiranana — Année 2025-2026
          </p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 text-sm text-amber-800 dark:text-amber-300">
        Vérifiez attentivement l'exactitude de toutes les informations. Des erreurs peuvent affecter votre dossier.
      </div>

      {/* Informations générales */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-teal-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Informations générales</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Année universitaire</label>
            <input type="text" value={form.annee_universitaire} onChange={e => update('annee_universitaire', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Parcours *</label>
            <select value={form.parcours} onChange={e => update('parcours', e.target.value)} className={inputClass}>
              <option value="">Choisir...</option>
              {PARCOURS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Année d'étude *</label>
            <select value={form.annee_etude} onChange={e => update('annee_etude', e.target.value)} className={inputClass}>
              <option value="1ère année">1ère année</option>
              <option value="2ème année">2ème année</option>
              <option value="3ème année">3ème année</option>
            </select>
          </div>
        </div>
      </div>

      {/* Renseignement étudiant + Connexion */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <FileText size={18} className="text-teal-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Renseignement sur l'étudiant</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nom *</label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Nom de famille" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Prénoms *</label>
            <input type="text" value={form.prenom} onChange={e => update('prenom', e.target.value)} placeholder="Prénom(s)" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Né(e) le</label>
            <input type="date" value={form.date_naissance} onChange={e => update('date_naissance', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Lieu de naissance</label>
            <input type="text" value={form.lieu_naissance} onChange={e => update('lieu_naissance', e.target.value)} placeholder="Ville" className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Adresse exacte</label>
            <input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="Adresse complète" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+261 ..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Téléphone 2 (facultatif)</label>
            <input type="tel" value={form.telephone2} onChange={e => update('telephone2', e.target.value)} placeholder="+261 ..." className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Adresse e-mail *</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@exemple.com" className={inputClass} />
          </div>
          {/* Password fields */}
          <div>
            <label className={labelClass}>Mot de passe *</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" className={`${inputClass} pl-9`} />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Confirmer le mot de passe *</label>
            <input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="••••••••" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sexe</label>
            <select value={form.sexe} onChange={e => update('sexe', e.target.value)} className={inputClass}>
              <option>Masculin</option><option>Féminin</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Nationalité</label>
            <select value={form.nationalite} onChange={e => update('nationalite', e.target.value)} className={inputClass}>
              {NATIONALITES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* CIN */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <FileText size={18} className="text-teal-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">CIN (Carte d'Identité Nationale)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Numéro du CIN</label>
            <input type="text" value={form.cin_numero} onChange={e => update('cin_numero', e.target.value)} placeholder="N° CIN" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date de délivrance</label>
            <input type="date" value={form.cin_date} onChange={e => update('cin_date', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Lieu de délivrance</label>
            <input type="text" value={form.cin_lieu} onChange={e => update('cin_lieu', e.target.value)} placeholder="Ville" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Baccalaureat + Diplome */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <GraduationCap size={18} className="text-teal-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Baccalauréat et diplôme</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Statut de l'étudiant</label>
            <select value={form.statut_etudiant} onChange={e => update('statut_etudiant', e.target.value)} className={inputClass}>
              <option>Admis</option><option>Redoublant</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Type de formation</label>
            <select value={form.type_formation} onChange={e => update('type_formation', e.target.value)} className={inputClass}>
              <option>Présentiel</option><option>En ligne</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Baccalauréat (type)</label>
            <select value={form.bacc_serie_type} onChange={e => update('bacc_serie_type', e.target.value)} className={inputClass}>
              {BACC_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Série / Spécialité au Bacc</label>
            <select value={form.bacc_serie} onChange={e => update('bacc_serie', e.target.value)} className={inputClass}>
              <option value="">Choisir...</option>
              {BACC_SERIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Mention Bacc</label>
            <select value={form.bacc_mention} onChange={e => update('bacc_mention', e.target.value)} className={inputClass}>
              {MENTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Lieu d'obtention du Bacc</label>
            <input type="text" value={form.bacc_lieu} onChange={e => update('bacc_lieu', e.target.value)} placeholder="Ville" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Année d'obtention du Bacc</label>
            <input type="number" value={form.bacc_annee} onChange={e => update('bacc_annee', e.target.value)} placeholder="Ex: 2024" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Dernier diplôme obtenu</label>
            <select value={form.dernier_diplome} onChange={e => update('dernier_diplome', e.target.value)} className={inputClass}>
              {DIPLOMES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Mention du diplôme</label>
            <select value={form.diplome_mention} onChange={e => update('diplome_mention', e.target.value)} className={inputClass}>
              {MENTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Lieu d'obtention du diplôme</label>
            <input type="text" value={form.diplome_lieu} onChange={e => update('diplome_lieu', e.target.value)} placeholder="Ville" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Parcours/Spécialité du diplôme</label>
            <input type="text" value={form.diplome_parcours} onChange={e => update('diplome_parcours', e.target.value)} placeholder="Spécialité" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Année d'obtention du diplôme</label>
            <input type="number" value={form.diplome_annee} onChange={e => update('diplome_annee', e.target.value)} placeholder="Ex: 2025" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Parents */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <Users size={18} className="text-teal-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Renseignement sur les parents</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Fils/Fille de (Père)</label>
            <input type="text" value={form.pere_nom} onChange={e => update('pere_nom', e.target.value)} placeholder="Nom du père" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Profession du père</label>
            <input type="text" value={form.pere_profession} onChange={e => update('pere_profession', e.target.value)} placeholder="Profession" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Et de (Mère)</label>
            <input type="text" value={form.mere_nom} onChange={e => update('mere_nom', e.target.value)} placeholder="Nom de la mère" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Profession de la mère</label>
            <input type="text" value={form.mere_profession} onChange={e => update('mere_profession', e.target.value)} placeholder="Profession" className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Adresse des parents</label>
            <input type="text" value={form.parent_adresse} onChange={e => update('parent_adresse', e.target.value)} placeholder="Adresse complète" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact d'un parent</label>
            <input type="tel" value={form.parent_contact} onChange={e => update('parent_contact', e.target.value)} placeholder="+261 ..." className={inputClass} />
          </div>
        </div>
      </div>

      {/* Urgence + Santé */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <Heart size={18} className="text-teal-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Contact d'urgence et santé</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Personne à contacter en cas d'urgence</label>
            <input type="text" value={form.contact_urgence_nom} onChange={e => update('contact_urgence_nom', e.target.value)} placeholder="Nom complet" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Téléphone d'urgence</label>
            <input type="tel" value={form.contact_urgence_tel} onChange={e => update('contact_urgence_tel', e.target.value)} placeholder="+261 ..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Groupe sanguin</label>
            <select value={form.groupe_sanguin} onChange={e => update('groupe_sanguin', e.target.value)} className={inputClass}>
              {GROUPES_SANGUIN.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Renseignements complémentaires</label>
            <textarea value={form.renseignements_complementaires} onChange={e => update('renseignements_complementaires', e.target.value)} rows={2} placeholder="Allergies, informations médicales, etc." className={`${inputClass} resize-none`} />
          </div>
        </div>
      </div>

      {/* Droit d'inscription */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <CreditCard size={18} className="text-teal-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Suivi du droit d'inscription</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>N° de reçu</label>
            <input type="text" value={form.receipt_no} onChange={e => update('receipt_no', e.target.value)} placeholder="Numéro du reçu" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date du reçu</label>
            <input type="date" value={form.receipt_date} onChange={e => update('receipt_date', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Montant (Ar)</label>
            <input type="number" value={form.receipt_amount} onChange={e => update('receipt_amount', e.target.value)} placeholder="Montant en Ariary" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button onClick={() => onNavigate('home')} className="px-5 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-xl transition-all shadow-md shadow-teal-500/30 disabled:opacity-60 active:scale-95">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={16} />}
          Valider l'inscription
        </button>
      </div>
    </div>
  );
}
