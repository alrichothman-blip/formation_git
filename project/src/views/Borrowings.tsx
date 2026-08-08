import { useEffect, useState, useMemo, useRef } from 'react';
import { BookMarked, Trash2, CheckCircle, AlertTriangle, Clock, RotateCcw, Search, User, X, Check, FileText, FileSpreadsheet } from 'lucide-react';
import { borrowings as borrowingsApi, books as booksApi, members as membersApi } from '../lib/api';
import { Book, Member } from '../lib/types';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BorrowingsProps {
  searchQuery: string;
  addTrigger: number;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  isAdmin: boolean;
  initialMemberId?: number;
  initialOpenBorrowingId?: number;
}

export default function Borrowings({ searchQuery, addTrigger, showToast, isAdmin, initialMemberId, initialOpenBorrowingId }: BorrowingsProps) {
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('active');
  const [modalMode, setModalMode] = useState<'add' | 'return' | null>(null);
  const [selectedBorrowing, setSelectedBorrowing] = useState<any | null>(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [form, setForm] = useState({ book_ids: [] as string[], member_id: '', borrow_date: new Date().toISOString().split('T')[0], due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [studentSearch, setStudentSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [borrowDateFrom, setBorrowDateFrom] = useState('');
  const [borrowDateTo, setBorrowDateTo] = useState('');
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (addTrigger > 0 && isAdmin) setModalMode('add'); }, [addTrigger, isAdmin]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [bData, bookData, memData] = await Promise.all([
        borrowingsApi.list(),
        booksApi.list(),
        membersApi.list(),
      ]);
      setBorrowings(bData);
      setBooks(bookData);
      setMembers(memData);
      // if initial member filter came from navigation, pre-select the member
      if (initialMemberId) {
        const m = (memData || []).find((x: any) => Number(x.id) === Number(initialMemberId));
        if (m) {
          setSelectedMember(m);
          setStudentSearch(`${m.name} ${m.prenom}`.trim());
        }
      }
      // if initial open borrowing id is provided, open modal for that borrowing if active
      if (initialOpenBorrowingId) {
        const b = (bData || []).find((x: any) => Number(x.id) === Number(initialOpenBorrowingId));
        if (b) {
          if (!b.return_date && b.status !== 'returned') {
            setSelectedBorrowing(b);
          } else {
            showToast('info', `L'emprunt "${b.books?.title || ''}" a déjà été retourné.`);
          }
        }
      }
    } catch (e: any) {
      showToast('error', 'Erreur lors du chargement: ' + e.message);
    }
    setLoading(false);
  }

  const MAX_ACTIVE_BORROWS = 2;

  async function handleBorrow() {
    if (!form.book_ids.length || !form.member_id) { showToast('error', 'Veuillez sélectionner au moins un livre et un étudiant.'); return; }
    // check member active borrows
    const memberIdNum = parseInt(form.member_id);
    const memberActive = borrowings.filter(b => Number(b.member_id) === memberIdNum && (b.return_date === null || b.return_date === undefined)).length;
    const requested = form.book_ids.length;
    if (memberActive >= MAX_ACTIVE_BORROWS) { showToast('error', `L'étudiant a déjà ${memberActive} emprunts actifs (limite ${MAX_ACTIVE_BORROWS}).`); return; }
    if (memberActive + requested > MAX_ACTIVE_BORROWS) { showToast('error', `Limite dépassée: vous pouvez encore emprunter ${MAX_ACTIVE_BORROWS - memberActive} livre(s).`); return; }
    // check availability for each selected book
    const selectedBooks = form.book_ids.map(id => books.find(b => b.id === parseInt(id))).filter(Boolean) as Book[];
    for (const book of selectedBooks) {
      if (!book || book.available_copies < 1) { showToast('error', `Le livre "${book?.title || 'inconnu'}" n'est pas disponible.`); return; }
    }
    setSaving(true);
    try {
      await borrowingsApi.create({
        book_ids: form.book_ids.map(id => parseInt(id)),
        member_id: parseInt(form.member_id),
        borrow_date: form.borrow_date,
        due_date: form.due_date,
        notes: form.notes,
      });
      showToast('success', 'Emprunt enregistré!');
      setModalMode(null);
      resetForm();
      fetchData();
    } catch (e: any) {
      showToast('error', 'Erreur lors de l\'emprunt: ' + e.message);
    }
    setSaving(false);
  }

  function toggleBookSelection(bookId: string) {
    setForm(prev => {
      const has = prev.book_ids.includes(bookId);
      return {
        ...prev,
        book_ids: has ? prev.book_ids.filter(id => id !== bookId) : [...prev.book_ids, bookId],
      };
    });
  }

  function resetForm() {
    setForm({ book_ids: [], member_id: '', borrow_date: new Date().toISOString().split('T')[0], due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], notes: '' });
    setStudentSearch('');
    setSelectedMember(null);
  }

  async function handleReturn(borrowing: any) {
    if (borrowing.return_date || borrowing.status === 'returned') {
      showToast('warning', 'Cet emprunt a déjà été retourné.');
      setSelectedBorrowing(null);
      return;
    }
    setSaving(true);
    try {
      await borrowingsApi.return(borrowing.id, { return_date: new Date().toISOString().split('T')[0], notes: returnNotes || borrowing.notes });
      showToast('success', 'Livre retourné avec succès!');
    } catch (e: any) {
      showToast('error', 'Erreur lors du retour: ' + e.message);
    }
    setSaving(false);
    setSelectedBorrowing(null);
    setReturnNotes('');
    fetchData();
  }

  async function handleDelete(id: number) {
    try {
      await borrowingsApi.remove(id);
      showToast('success', 'Emprunt supprimé.');
      fetchData();
    } catch (e: any) {
      showToast('error', 'Erreur lors de la suppression.');
    }
    setDeleteConfirm(null);
  }

  function selectMember(m: Member) {
    setSelectedMember(m);
    setForm(prev => ({ ...prev, member_id: String(m.id) }));
    setStudentSearch(`${m.name} ${m.prenom}`.trim());
    setShowDropdown(false);
  }

  const filteredMembers = useMemo(() => {
    if (!studentSearch.trim()) return members.slice(0, 8);
    const q = studentSearch.toLowerCase();
    return members.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.prenom || '').toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.parcours || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [members, studentSearch]);

  const filteredBooks = useMemo(() => {
    const availableBooks = books.filter(b => b.available_copies > 0);
    if (!bookSearch.trim()) return availableBooks;
    const q = bookSearch.toLowerCase();
    return availableBooks.filter(b =>
      b.title.toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q) ||
      (b.isbn || '').toLowerCase().includes(q)
    );
  }, [books, bookSearch]);

  const filtered = useMemo(() => borrowings.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || b.books?.title?.toLowerCase().includes(q) || b.members?.name?.toLowerCase().includes(q) || (b.members?.prenom || '').toLowerCase().includes(q);
    const matchStatus = !filterStatus || b.status === filterStatus;
    let matchDate = true;
    if (borrowDateFrom) {
      matchDate = matchDate && b.borrow_date >= borrowDateFrom;
    }
    if (borrowDateTo) {
      matchDate = matchDate && b.borrow_date <= borrowDateTo;
    }
    return matchSearch && matchStatus && matchDate;
  }), [borrowings, searchQuery, filterStatus, borrowDateFrom, borrowDateTo]);

  const statusConfig: Record<string, any> = {
    active: { label: 'En cours', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Clock },
    overdue: { label: 'En retard', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: AlertTriangle },
    returned: { label: 'Retourné', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  };

  const counts = useMemo(() => ({
    active: borrowings.filter(b => b.status === 'active').length,
    overdue: borrowings.filter(b => b.status === 'overdue').length,
    returned: borrowings.filter(b => b.status === 'returned').length,
  }), [borrowings]);

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

  function exportBorrowingsExcel() {
    try {
      const rows = [
        ['Bibliothèque IST - Rapport des emprunts'],
        [],
        ['ID', 'Livre', 'ISBN', 'Étudiant', 'Contact', 'Domicile', 'Parcours', 'Date emprunt', 'Date prévue', 'Date retour'],
        ...borrowings.map(b => [
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
      XLSX.writeFile(wb, `emprunts_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('success', 'Export Excel généré avec succès.');
    } catch (e) {
      showToast('error', 'Erreur lors de l\'export Excel.');
    }
  }

  async function exportBorrowingsPdf() {
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
      doc.text('Rapport des emprunts', headerX, headerY + 20);
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`, headerX, headerY + 36);
      doc.setFontSize(10);
      doc.text(`Total emprunts: ${borrowings.length} • En cours: ${counts.active} • En retard: ${counts.overdue} • Retournés: ${counts.returned}`, margin, margin + 80);

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
        body: borrowings.map(b => [
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
          2: { cellWidth: 160 },
          3: { cellWidth: 70 },
          4: { cellWidth: 85 },
          5: { cellWidth: 85 },
          6: { cellWidth: 85 },
        },
        didDrawPage: () => {
          const pageCount = doc.internal.pages.length - 1;
          if (pageCount > 0) {
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(`Page ${pageCount}`, doc.internal.pageSize.getWidth() - margin - 40, doc.internal.pageSize.getHeight() - 20);
          }
        },
      });
      doc.save(`emprunts_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('success', 'Export PDF généré avec succès.');
    } catch (e) {
      showToast('error', 'Erreur lors de l\'export PDF.');
    }
  }

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
        {[
          { value: '', label: 'Tous', count: borrowings.length },
          { value: 'active', label: 'En cours', count: counts.active },
          { value: 'overdue', label: 'En retard', count: counts.overdue },
          { value: 'returned', label: 'Retournés', count: counts.returned },
        ].map(({ value, label, count }) => (
          <button
            key={value}
            onClick={() => setFilterStatus(value)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 ${
              filterStatus === value
                ? 'bg-teal-500 text-white border-teal-500'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:text-teal-500'
            }`}
          >
            {label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${filterStatus === value ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {count}
            </span>
          </button>
        ))}
        {isAdmin && (
          <>
            <button
              onClick={() => setShowDateFilters(prev => !prev)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full border ${showDateFilters ? 'bg-teal-500 text-white border-teal-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-teal-50 hover:text-teal-600'} transition-all`}
            >
              <Search size={16} />
              Filtres
            </button>
            <button
              onClick={() => { setFilterStatus(''); setBorrowDateFrom(''); setBorrowDateTo(''); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-teal-600 transition-all"
            >
              Réinitialiser
            </button>
            <button
              onClick={exportBorrowingsExcel}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-teal-50 hover:text-teal-600 transition-all"
            >
              <FileSpreadsheet size={16} />
              Exporter XLSX
            </button>
            <button
              onClick={exportBorrowingsPdf}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-600 transition-all"
            >
              <FileText size={16} />
              Exporter PDF
            </button>
          </>
        )}
      </div>

      {showDateFilters && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className={labelClass}>Date emprunt du</label>
            <input type="date" value={borrowDateFrom} onChange={e => setBorrowDateFrom(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date emprunt au</label>
            <input type="date" value={borrowDateTo} onChange={e => setBorrowDateTo(e.target.value)} className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setFilterStatus(''); setBorrowDateFrom(''); setBorrowDateTo(''); }}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-600 transition-all"
            >
              Effacer
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <BookMarked size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Aucun emprunt trouvé</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Livre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Étudiant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Date emprunt</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date retour</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filtered.map(b => {
                  const sc = statusConfig[b.status] || statusConfig.active;
                  const StatusIcon = sc.icon;
                  const daysLeft = b.status !== 'returned' ? Math.ceil((new Date(b.due_date).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <tr key={b.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${b.status === 'overdue' ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-11 rounded-lg overflow-hidden flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${b.books?.categories?.color || '#3B82F6'}, ${(b.books?.categories?.color || '#3B82F6')}aa)` }}
                          >
                            {b.books?.cover_url ? (
                              <img src={b.books.cover_url} alt={b.books.title} className="w-full h-full object-cover" />
                            ) : (
                              <span>{b.books?.title?.charAt(0) || '?'}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{b.books?.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{b.books?.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{b.members?.name} {b.members?.prenom}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{b.members?.parcours || b.members?.email}</p>
                      </td>
                      <td className="px-6 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{new Date(b.borrow_date).toLocaleDateString('fr-FR')}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        {b.return_date ? (
                          <span className="text-sm text-emerald-600 dark:text-emerald-400">{new Date(b.return_date).toLocaleDateString('fr-FR')}</span>
                        ) : (
                          <div>
                            <span className={`text-sm ${daysLeft && daysLeft < 0 ? 'text-red-600 dark:text-red-400 font-semibold' : daysLeft && daysLeft <= 3 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                              {new Date(b.due_date).toLocaleDateString('fr-FR')}
                            </span>
                            {daysLeft !== null && (
                              <p className={`text-xs ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                                {daysLeft < 0 ? `${Math.abs(daysLeft)}j de retard` : daysLeft === 0 ? 'Aujourd\'hui' : `${daysLeft}j restants`}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${sc.color} ${sc.bg}`}>
                          <StatusIcon size={10} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {b.status !== 'returned' && !b.return_date && isAdmin && (
                            <button
                              onClick={() => { setSelectedBorrowing(b); }}
                              title="Enregistrer le retour"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                            >
                              <RotateCcw size={15} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteConfirm(b.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalMode === 'add' && (
        <Modal title="Nouvel emprunt" onClose={() => { setModalMode(null); resetForm(); }} size="lg">
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Étudiant * (recherche automatique)</label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setSelectedMember(null);
                      setForm(prev => ({ ...prev, member_id: '' }));
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Tapez le nom ou prénom de l'étudiant..."
                    className={`${inputClass} pl-9`}
                  />
                  {selectedMember && (
                    <button
                      onClick={() => { resetForm(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {showDropdown && filteredMembers.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {filteredMembers.map(m => (
                      <button
                        key={m.id}
                        onClick={() => selectMember(m)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                      >
                        <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {m.name} {m.prenom}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {m.parcours || '—'} {m.annee_etude ? `· ${m.annee_etude}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && studentSearch.trim() && filteredMembers.length === 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Aucun étudiant trouvé. Vérifiez l'inscription.</p>
                  </div>
                )}
              </div>
            </div>

            {selectedMember && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800/50">
                <div className="md:col-span-2 flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300 mb-1">
                  <CheckCircle size={14} />
                  Informations auto-remplies depuis l'inscription
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Parcours</span>
                  <span className="text-sm text-slate-800 dark:text-slate-200">{selectedMember.parcours || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Année d'étude</span>
                  <span className="text-sm text-slate-800 dark:text-slate-200">{selectedMember.annee_etude || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Nom complet</span>
                  <span className="text-sm text-slate-800 dark:text-slate-200">{selectedMember.name} {selectedMember.prenom}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">E-mail</span>
                  <span className="text-sm text-slate-800 dark:text-slate-200">{selectedMember.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Téléphone</span>
                  <span className="text-sm text-slate-800 dark:text-slate-200">{selectedMember.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Adresse</span>
                  <span className="text-sm text-slate-800 dark:text-slate-200">{selectedMember.address || '—'}</span>
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>Livres * (sélection multiple possible, max 2)</label>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Rechercher un livre par titre, auteur ou ISBN..."
                  className={`${inputClass} pl-9`}
                />
              </div>
              <div className="grid gap-2 max-h-60 overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 p-2 shadow-sm">
                {filteredBooks.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Aucun livre disponible ne correspond à votre recherche.</div>
                ) : filteredBooks.map(b => {
                  const selected = form.book_ids.includes(String(b.id));
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => toggleBookSelection(String(b.id))}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 text-left ${selected ? 'border-teal-400 bg-teal-50/70 dark:border-teal-500 dark:bg-teal-900/30 shadow-sm' : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/60'}`}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-xl border transition-colors duration-200 ${selected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'}`}>
                        {selected ? <Check size={14} /> : null}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{b.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{b.author} ({b.available_copies} dispo.)</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Limite par étudiant: {MAX_ACTIVE_BORROWS} emprunts actifs simultanés.</p>
              {selectedMember && (
                <p className="text-xs text-slate-500 dark:text-slate-400">Emprunts actifs actuels: {borrowings.filter(b => b.member_id === selectedMember.id && !b.return_date).length}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date d'emprunt</label>
                <input type="date" value={form.borrow_date} onChange={e => setForm({ ...form, borrow_date: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date de retour prévue</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Notes optionnelles..." className={`${inputClass} resize-none`} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button onClick={() => { setModalMode(null); resetForm(); }} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-all">Annuler</button>
            <button onClick={handleBorrow} disabled={saving || !form.member_id || form.book_ids.length === 0 || form.book_ids.length > MAX_ACTIVE_BORROWS} className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-xl transition-all shadow-md shadow-teal-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Enregistrer l'emprunt
            </button>
          </div>
        </Modal>
      )}

      {selectedBorrowing && (
        <Modal title="Retour du livre" onClose={() => { setSelectedBorrowing(null); setReturnNotes(''); }} size="sm">
          <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{selectedBorrowing.books?.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedBorrowing.books?.author}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Emprunté par: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedBorrowing.members?.name} {selectedBorrowing.members?.prenom}</span></p>
          </div>
          <div className="mb-5">
            <label className={labelClass}>Notes de retour (optionnel)</label>
            <textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)} rows={2} placeholder="État du livre, commentaires..." className={`${inputClass} resize-none`} />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => { setSelectedBorrowing(null); setReturnNotes(''); }} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-all">Annuler</button>
            <button onClick={() => handleReturn(selectedBorrowing)} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all shadow-md shadow-emerald-500/30 disabled:opacity-60">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <CheckCircle size={15} /> Confirmer le retour
            </button>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Supprimer l'emprunt" onClose={() => setDeleteConfirm(null)} size="sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">Êtes-vous sûr de vouloir supprimer cet emprunt ?</p>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-all">Annuler</button>
            <button
              onClick={() => {
                if (deleteConfirm) {
                  handleDelete(deleteConfirm);
                }
              }}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-md shadow-red-500/30"
            >
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
