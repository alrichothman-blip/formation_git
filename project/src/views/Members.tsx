import { useEffect, useState, useMemo } from 'react';
import { Users, Edit2, Trash2, Eye, UserCheck, UserX, Calendar, Mail, Phone, MapPin, GraduationCap, BookOpen, FileText, Heart } from 'lucide-react';
import { members as membersApi, borrowings as borrowingsApi } from '../lib/api';
import { Member } from '../lib/types';
import Modal from '../components/Modal';

interface MembersProps {
  searchQuery: string;
  addTrigger: number;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

interface MemberFormData {
  name: string;
  prenom: string;
  email: string;
  phone: string;
  telephone2: string;
  address: string;
  parcours: string;
  annee_etude: string;
  annee_universitaire: string;
  statut_etudiant: string;
  sexe: string;
  nationalite: string;
  date_naissance: string;
  lieu_naissance: string;
  cin_numero: string;
  cin_date: string;
  cin_lieu: string;
  membership_date: string;
  membership_expiry: string;
  status: 'active' | 'suspended' | 'expired';
  notes: string;
}

const today = new Date().toISOString().split('T')[0];
const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const emptyForm: MemberFormData = {
  name: '', prenom: '', email: '', phone: '', telephone2: '', address: '',
  parcours: '', annee_etude: '3ème année', annee_universitaire: '2025-2026',
  statut_etudiant: 'Admis', sexe: 'Masculin', nationalite: 'Malagasy',
  date_naissance: '', lieu_naissance: '', cin_numero: '', cin_date: '', cin_lieu: '',
  membership_date: today, membership_expiry: nextYear, status: 'active', notes: ''
};

const statusConfig = {
  active: { label: 'Actif', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: UserCheck },
  suspended: { label: 'Suspendu', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: UserX },
  expired: { label: 'Expiré', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: UserX },
};

export default function Members({ searchQuery, showToast }: MembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterParcours, setFilterParcours] = useState('');
  const [modalMode, setModalMode] = useState<'edit' | 'view' | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [borrowingCounts, setBorrowingCounts] = useState<Record<number, number>>({});

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [membersData, borrowData] = await Promise.all([
        membersApi.list(),
        borrowingsApi.list(),
      ]);
      setMembers(membersData);
      const counts: Record<number, number> = {};
      borrowData.forEach((b: any) => {
        if (!b.return_date) counts[b.member_id] = (counts[b.member_id] || 0) + 1;
      });
      setBorrowingCounts(counts);
    } catch (e: any) {
      showToast('error', 'Erreur lors du chargement: ' + e.message);
    }
    setLoading(false);
  }

  function openEdit(m: Member) {
    setForm({
      name: m.name, prenom: m.prenom || '', email: m.email, phone: m.phone, telephone2: m.telephone2 || '',
      address: m.address, parcours: m.parcours || '', annee_etude: m.annee_etude || '3ème année',
      annee_universitaire: m.annee_universitaire || '2025-2026', statut_etudiant: m.statut_etudiant || 'Admis',
      sexe: m.sexe || 'Masculin', nationalite: m.nationalite || 'Malagasy',
      date_naissance: m.date_naissance || '', lieu_naissance: m.lieu_naissance || '',
      cin_numero: m.cin_numero || '', cin_date: m.cin_date || '', cin_lieu: m.cin_lieu || '',
      membership_date: m.membership_date, membership_expiry: m.membership_expiry,
      status: m.status, notes: m.notes,
    });
    setSelectedMember(m);
    setModalMode('edit');
  }

  function openView(m: Member) { setSelectedMember(m); setModalMode('view'); }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) { showToast('error', 'Le nom et l\'email sont requis.'); return; }
    setSaving(true);
    try {
      await membersApi.update(selectedMember!.id, {
        ...form,
        name: form.name.trim(), prenom: form.prenom.trim(), email: form.email.trim(),
        date_naissance: form.date_naissance || null, cin_date: form.cin_date || null,
      });
      showToast('success', 'Étudiant mis à jour!');
    } catch (e: any) {
      showToast('error', 'Erreur lors de la mise à jour: ' + e.message);
    }
    setSaving(false);
    setModalMode(null);
    fetchData();
  }

  async function handleDelete(id: number) {
    try {
      await membersApi.remove(id);
      showToast('success', 'Étudiant supprimé.');
      fetchData();
    } catch (e: any) {
      showToast('error', 'Impossible de supprimer (emprunts actifs?).');
    }
    setDeleteConfirm(null);
  }

  const parcoursOptions = useMemo(() => {
    const set = new Set(members.map(m => m.parcours).filter(Boolean));
    return Array.from(set);
  }, [members]);

  const filtered = useMemo(() =>
    members.filter(m => {
      const q = searchQuery.toLowerCase();
      return (!q || m.name.toLowerCase().includes(q) || (m.prenom || '').toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.phone.includes(q) || (m.parcours || '').toLowerCase().includes(q))
        && (!filterStatus || m.status === filterStatus)
        && (!filterParcours || m.parcours === filterParcours);
    }), [members, searchQuery, filterStatus, filterParcours]);

  const avatarLetters = (name: string, prenom: string) =>
    `${name} ${prenom}`.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarColors = ['bg-teal-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-emerald-500'];
  const avatarColor = (id: number) => avatarColors[id % avatarColors.length];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #e2e8f0', borderTopColor: '#14b8a6' }} />
    </div>
  );

  const inputClass = "w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white placeholder-slate-400 transition-all";
  const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(['', 'active', 'suspended', 'expired'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 ${
                filterStatus === s
                  ? 'bg-teal-500 text-white border-teal-500'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:text-teal-500'
              }`}
            >
              {s === '' ? 'Tous' : statusConfig[s].label}
            </button>
          ))}
        </div>
        {parcoursOptions.length > 0 && (
          <select
            value={filterParcours}
            onChange={(e) => setFilterParcours(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            <option value="">Tous les parcours</option>
            {parcoursOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">{filtered.length} étudiant{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <Users size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Aucun étudiant trouvé</p>
          <p className="text-sm">Utilisez le formulaire d'inscription pour enregistrer un nouvel étudiant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(member => {
            const sc = statusConfig[member.status];
            const StatusIcon = sc.icon;
            const loans = borrowingCounts[member.id] || 0;
            const isExpiring = new Date(member.membership_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            return (
              <div key={member.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-200 overflow-hidden group">
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 ${avatarColor(member.id)} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}>
                      {avatarLetters(member.name, member.prenom)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">
                          {member.name} {member.prenom}
                        </h3>
                        <span className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${sc.color} ${sc.bg}`}>
                          <StatusIcon size={10} />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{member.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    {member.parcours && (
                      <div className="flex items-center gap-2">
                        <GraduationCap size={11} className="text-teal-500" />
                        <span className="truncate">{member.parcours}</span>
                      </div>
                    )}
                    {member.annee_etude && (
                      <div className="flex items-center gap-2">
                        <BookOpen size={11} />
                        <span>{member.annee_etude} — {member.annee_universitaire || '2025-2026'}</span>
                      </div>
                    )}
                    {member.phone && <div className="flex items-center gap-2"><Phone size={11} />{member.phone}</div>}
                    <div className="flex items-center gap-2">
                      <Calendar size={11} />
                      <span>Expire: </span>
                      <span className={isExpiring && member.status === 'active' ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}>
                        {new Date(member.membership_expiry).toLocaleDateString('fr-FR')}
                      </span>
                      {isExpiring && member.status === 'active' && <span className="text-amber-500 font-bold">!</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">{loans}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Emprunts actifs</div>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-600" />
                    <div className="text-center">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inscrit le</div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">{new Date(member.membership_date).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => openView(member)} className="flex-1 flex items-center justify-center gap-1.5 p-2 text-xs text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-all">
                      <Eye size={13} /> Voir
                    </button>
                    <button onClick={() => openEdit(member)} className="flex-1 flex items-center justify-center gap-1.5 p-2 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                      <Edit2 size={13} /> Éditer
                    </button>
                    <button onClick={() => setDeleteConfirm(member.id)} className="flex-1 flex items-center justify-center gap-1.5 p-2 text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                      <Trash2 size={13} /> Suppr.
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalMode === 'edit' && selectedMember && (
        <Modal title="Modifier l'étudiant" onClose={() => setModalMode(null)} size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nom *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Prénom(s)</label>
              <input type="text" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Adresse</label>
              <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Parcours</label>
              <input type="text" value={form.parcours} onChange={e => setForm({ ...form, parcours: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Année d'étude</label>
              <select value={form.annee_etude} onChange={e => setForm({ ...form, annee_etude: e.target.value })} className={inputClass}>
                <option>1ère année</option><option>2ème année</option><option>3ème année</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Statut bibliothèque</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className={inputClass}>
                <option value="active">Actif</option><option value="suspended">Suspendu</option><option value="expired">Expiré</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Date d'adhésion</label>
              <input type="date" value={form.membership_date} onChange={e => setForm({ ...form, membership_date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date d'expiration</label>
              <input type="date" value={form.membership_expiry} onChange={e => setForm({ ...form, membership_expiry: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Notes internes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button onClick={() => setModalMode(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-xl transition-all shadow-md shadow-teal-500/30 disabled:opacity-60 flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Enregistrer
            </button>
          </div>
        </Modal>
      )}

      {modalMode === 'view' && selectedMember && (
        <Modal title="Profil de l'étudiant" onClose={() => setModalMode(null)} size="lg">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 ${avatarColor(selectedMember.id)} rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-lg`}>
              {avatarLetters(selectedMember.name, selectedMember.prenom)}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedMember.name} {selectedMember.prenom}</h3>
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold mt-1 ${statusConfig[selectedMember.status].color} ${statusConfig[selectedMember.status].bg}`}>
              {statusConfig[selectedMember.status].label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {selectedMember.parcours && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <GraduationCap size={14} className="text-teal-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Parcours</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedMember.parcours}</p>
                </div>
              </div>
            )}
            {selectedMember.annee_etude && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <BookOpen size={14} className="text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Année d'étude</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedMember.annee_etude} — {selectedMember.annee_universitaire || '2025-2026'}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <Mail size={14} className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400 dark:text-slate-500">E-mail</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{selectedMember.email}</p>
              </div>
            </div>
            {selectedMember.phone && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <Phone size={14} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Téléphone</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedMember.phone}{selectedMember.telephone2 ? ` / ${selectedMember.telephone2}` : ''}</p>
                </div>
              </div>
            )}
            {selectedMember.address && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl md:col-span-2">
                <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Adresse</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedMember.address}</p>
                </div>
              </div>
            )}
            {selectedMember.cin_numero && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <FileText size={14} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">CIN</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedMember.cin_numero}{selectedMember.cin_lieu ? ` (${selectedMember.cin_lieu})` : ''}</p>
                </div>
              </div>
            )}
            {selectedMember.date_naissance && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Né(e) le</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{new Date(selectedMember.date_naissance).toLocaleDateString('fr-FR')}{selectedMember.lieu_naissance ? ` à ${selectedMember.lieu_naissance}` : ''}</p>
                </div>
              </div>
            )}
          </div>

          {(selectedMember.pere_nom || selectedMember.mere_nom) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {selectedMember.pere_nom && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Père</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedMember.pere_nom}</p>
                  {selectedMember.pere_profession && <p className="text-xs text-slate-500">{selectedMember.pere_profession}</p>}
                </div>
              )}
              {selectedMember.mere_nom && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Mère</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedMember.mere_nom}</p>
                  {selectedMember.mere_profession && <p className="text-xs text-slate-500">{selectedMember.mere_profession}</p>}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedMember.contact_urgence_nom && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <Heart size={14} className="text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Contact d'urgence</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedMember.contact_urgence_nom} {selectedMember.contact_urgence_tel ? `— ${selectedMember.contact_urgence_tel}` : ''}</p>
                </div>
              </div>
            )}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-400 dark:text-slate-500">Emprunts actifs</p>
              <p className="font-bold text-xl text-slate-900 dark:text-white">{borrowingCounts[selectedMember.id] || 0}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button onClick={() => { setModalMode(null); openEdit(selectedMember); }} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 transition-all">
              <Edit2 size={14} /> Modifier
            </button>
            <button onClick={() => setModalMode(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-all ml-auto">Fermer</button>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Confirmer la suppression" onClose={() => setDeleteConfirm(null)} size="sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">Êtes-vous sûr de vouloir supprimer cet étudiant ? Ses emprunts seront également supprimés.</p>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-all">Annuler</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-md shadow-red-500/30">Supprimer</button>
          </div>
        </Modal>
      )}
    </>
  );
}
