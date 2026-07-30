import { useEffect, useState, useMemo } from 'react';
import { BookOpen, Edit2, Trash2, Eye, Filter, Grid, List, ChevronDown, X } from 'lucide-react';
import { books as booksApi, categories as categoriesApi } from '../lib/api';
import { Book as BookType, Category } from '../lib/types';
import Modal from '../components/Modal';

interface BooksProps {
  searchQuery: string;
  onAdd: () => void;
  addTrigger: number;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  isAdmin: boolean;
}

interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  category_id: string;
  description: string;
  cover_url: string;
  total_copies: number;
  published_year: string;
  language: string;
  pages: string;
  publisher: string;
}

const emptyForm: BookFormData = {
  title: '', author: '', isbn: '', category_id: '', description: '',
  cover_url: '', total_copies: 1, published_year: '', language: 'Français', pages: '', publisher: ''
};

export default function Books({ searchQuery, addTrigger, showToast, isAdmin }: BooksProps) {
  const [books, setBooks] = useState<BookType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [form, setForm] = useState<BookFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (addTrigger > 0 && isAdmin) openAdd(); }, [addTrigger, isAdmin]);

  async function fetchData() {
    setLoading(true);
    try {
      const [booksData, catsData] = await Promise.all([
        booksApi.list(),
        categoriesApi.list(),
      ]);
      setBooks(booksData);
      setCategories(catsData);
    } catch (e: any) {
      showToast('error', 'Erreur lors du chargement: ' + e.message);
    }
    setLoading(false);
  }

  function openAdd() {
    setForm(emptyForm);
    setSelectedBook(null);
    setModalMode('add');
  }

  function openEdit(book: BookType) {
    setForm({
      title: book.title, author: book.author, isbn: book.isbn || '',
      category_id: book.category_id ? String(book.category_id) : '', description: book.description,
      cover_url: book.cover_url, total_copies: book.total_copies,
      published_year: book.published_year?.toString() || '',
      language: book.language, pages: book.pages?.toString() || '',
      publisher: book.publisher,
    });
    setSelectedBook(book);
    setModalMode('edit');
  }

  function openView(book: BookType) {
    setSelectedBook(book);
    setModalMode('view');
  }

  async function handleSave() {
    if (!form.title.trim() || !form.author.trim()) {
      showToast('error', 'Le titre et l\'auteur sont requis.');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(), author: form.author.trim(),
      isbn: form.isbn.trim() || null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      description: form.description, cover_url: form.cover_url,
      total_copies: form.total_copies,
      published_year: form.published_year ? parseInt(form.published_year) : null,
      language: form.language, pages: form.pages ? parseInt(form.pages) : null,
      publisher: form.publisher,
    };

    try {
      if (modalMode === 'add') {
        await booksApi.create(payload);
        showToast('success', 'Livre ajouté avec succès!');
      } else {
        await booksApi.update(selectedBook!.id, payload);
        showToast('success', 'Livre mis à jour avec succès!');
      }
    } catch (e: any) {
      showToast('error', 'Erreur: ' + e.message);
    }

    setSaving(false);
    setModalMode(null);
    fetchData();
  }

  async function handleDelete(id: number) {
    try {
      await booksApi.remove(id);
      showToast('success', 'Livre supprimé.');
      fetchData();
    } catch (e: any) {
      showToast('error', 'Erreur lors de la suppression.');
    }
    setDeleteConfirm(null);
  }

  const filtered = useMemo(() => {
    return books.filter(b => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.isbn || '').includes(q);
      const matchCat = !filterCategory || String(b.category_id) === filterCategory;
      const matchAvail = !filterAvailability || (filterAvailability === 'available' ? b.available_copies > 0 : b.available_copies === 0);
      return matchSearch && matchCat && matchAvail;
    });
  }, [books, searchQuery, filterCategory, filterAvailability]);

  const getCategoryColor = (book: any) => book.categories?.color || '#3B82F6';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #e2e8f0', borderTopColor: '#14b8a6' }} />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
              showFilters || filterCategory || filterAvailability
                ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Filter size={15} />
            Filtres
            {(filterCategory || filterAvailability) && (
              <span className="w-4 h-4 bg-teal-500 text-white text-xs rounded-full flex items-center justify-center">
                {(filterCategory ? 1 : 0) + (filterAvailability ? 1 : 0)}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="">Toute disponibilité</option>
                <option value="available">Disponibles</option>
                <option value="unavailable">Indisponibles</option>
              </select>
              {(filterCategory || filterAvailability) && (
                <button
                  onClick={() => { setFilterCategory(''); setFilterAvailability(''); }}
                  className="flex items-center gap-1 px-2.5 py-2 text-xs text-red-500 hover:text-red-600 border border-red-200 dark:border-red-900/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <X size={12} /> Effacer
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center">
          <span className="text-sm text-slate-500 dark:text-slate-400 mr-3">{filtered.length} livre{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`p-2 transition-colors ${view === 'grid' ? 'bg-teal-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 transition-colors ${view === 'list' ? 'bg-teal-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <BookOpen size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Aucun livre trouvé</p>
          <p className="text-sm">Essayez de modifier vos filtres ou ajoutez un nouveau livre</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(book => (
            <div key={book.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div
                className="h-40 flex items-center justify-center text-white text-4xl font-bold relative"
                style={{ background: `linear-gradient(135deg, ${getCategoryColor(book)}, ${getCategoryColor(book)}aa)` }}
              >
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <span>{book.title.charAt(0)}</span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-2 flex-1">{book.title}</h3>
                  <span
                    className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      book.available_copies > 0
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {book.available_copies}/{book.total_copies}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{book.author}</p>
                {book.categories && (
                  <span
                    className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-3"
                    style={{ backgroundColor: getCategoryColor(book) + '20', color: getCategoryColor(book) }}
                  >
                    {book.categories.name}
                  </span>
                )}
                <div className="flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={() => openView(book)} className="flex-1 flex items-center justify-center gap-1 p-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all">
                    <Eye size={13} /> Voir
                  </button>
                  {isAdmin && <button onClick={() => openEdit(book)} className="flex-1 flex items-center justify-center gap-1 p-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                    <Edit2 size={13} /> Éditer
                  </button>}
                  {isAdmin && <button onClick={() => setDeleteConfirm(book.id)} className="flex-1 flex items-center justify-center gap-1 p-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                    <Trash2 size={13} /> Suppr.
                  </button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Titre / Auteur</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">ISBN</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {filtered.map(book => (
                <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-11 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${getCategoryColor(book)}, ${getCategoryColor(book)}aa)` }}
                      >
                        {book.title.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{book.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 hidden md:table-cell">
                    {book.categories ? (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: getCategoryColor(book) + '20', color: getCategoryColor(book) }}
                      >
                        {book.categories.name}
                      </span>
                    ) : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-3.5 hidden lg:table-cell">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{book.isbn || '—'}</span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`text-sm font-bold ${book.available_copies > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {book.available_copies}
                    </span>
                    <span className="text-slate-400 text-xs">/{book.total_copies}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openView(book)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all"><Eye size={15} /></button>
                      {isAdmin && <button onClick={() => openEdit(book)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><Edit2 size={15} /></button>}
                      {isAdmin && <button onClick={() => setDeleteConfirm(book.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(modalMode === 'add' || modalMode === 'edit') && (
        <Modal title={modalMode === 'add' ? 'Ajouter un livre' : 'Modifier le livre'} onClose={() => setModalMode(null)} size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Titre *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Titre du livre"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Auteur *</label>
              <input type="text" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Nom de l'auteur" className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white placeholder-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">ISBN</label>
              <input type="text" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} placeholder="978-..." className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white placeholder-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Catégorie</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white">
                <option value="">Sélectionner...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Éditeur</label>
              <input type="text" value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} placeholder="Maison d'édition" className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white placeholder-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Année de publication</label>
              <input type="number" value={form.published_year} onChange={e => setForm({ ...form, published_year: e.target.value })} placeholder="Ex: 2023" className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white placeholder-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nombre de pages</label>
              <input type="number" value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} placeholder="Nombre de pages" className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white placeholder-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Langue</label>
              <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white">
                <option>Français</option><option>Anglais</option><option>Arabe</option><option>Espagnol</option><option>Allemand</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nombre d'exemplaires</label>
              <input type="number" min="1" value={form.total_copies} onChange={e => setForm({ ...form, total_copies: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">URL de couverture</label>
              <input type="url" value={form.cover_url} onChange={e => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white placeholder-slate-400" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Résumé ou description..." className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-slate-800 dark:text-white placeholder-slate-400 resize-none" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button onClick={() => setModalMode(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-xl transition-all shadow-md shadow-teal-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {modalMode === 'add' ? 'Ajouter le livre' : 'Enregistrer'}
            </button>
          </div>
        </Modal>
      )}

      {modalMode === 'view' && selectedBook && (
        <Modal title="Détails du livre" onClose={() => setModalMode(null)} size="lg">
          <div className="flex gap-6">
            <div
              className="w-28 h-36 rounded-xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${getCategoryColor(selectedBook)}, ${getCategoryColor(selectedBook)}aa)` }}
            >
              {selectedBook.title.charAt(0)}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedBook.title}</h3>
                <p className="text-slate-500 dark:text-slate-400">{selectedBook.author}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedBook.isbn && <div><span className="text-slate-500 dark:text-slate-400 block text-xs font-medium">ISBN</span><span className="text-slate-800 dark:text-slate-200">{selectedBook.isbn}</span></div>}
                {selectedBook.published_year && <div><span className="text-slate-500 dark:text-slate-400 block text-xs font-medium">Année</span><span className="text-slate-800 dark:text-slate-200">{selectedBook.published_year}</span></div>}
                {selectedBook.publisher && <div><span className="text-slate-500 dark:text-slate-400 block text-xs font-medium">Éditeur</span><span className="text-slate-800 dark:text-slate-200">{selectedBook.publisher}</span></div>}
                {selectedBook.pages && <div><span className="text-slate-500 dark:text-slate-400 block text-xs font-medium">Pages</span><span className="text-slate-800 dark:text-slate-200">{selectedBook.pages}</span></div>}
                <div><span className="text-slate-500 dark:text-slate-400 block text-xs font-medium">Langue</span><span className="text-slate-800 dark:text-slate-200">{selectedBook.language}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400 block text-xs font-medium">Disponibles</span>
                  <span className={`font-bold ${selectedBook.available_copies > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {selectedBook.available_copies} / {selectedBook.total_copies}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {selectedBook.description && (
            <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedBook.description}</p>
            </div>
          )}
          <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
            {isAdmin && <button onClick={() => { setModalMode(null); openEdit(selectedBook); }} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all">
              <Edit2 size={14} /> Modifier
            </button>}
            <button onClick={() => setModalMode(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all ml-auto">
              Fermer
            </button>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Confirmer la suppression" onClose={() => setDeleteConfirm(null)} size="sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">Êtes-vous sûr de vouloir supprimer ce livre ? Cette action est irréversible.</p>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-all">Annuler</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-md shadow-red-500/30">Supprimer</button>
          </div>
        </Modal>
      )}
    </>
  );
}
