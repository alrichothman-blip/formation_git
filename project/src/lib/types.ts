export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  category_id: number | null;
  description: string;
  cover_url: string;
  total_copies: number;
  available_copies: number;
  published_year: number | null;
  language: string;
  pages: number | null;
  publisher: string;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  membership_date: string;
  membership_expiry: string;
  status: 'active' | 'suspended' | 'expired';
  avatar_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
  prenom: string;
  sexe: string;
  date_naissance: string | null;
  lieu_naissance: string;
  nationalite: string;
  cin_numero: string;
  cin_date: string | null;
  cin_lieu: string;
  parcours: string;
  annee_etude: string;
  annee_universitaire: string;
  statut_etudiant: string;
  telephone2: string;
  bacc_serie: string;
  bacc_mention: string;
  bacc_annee: number | null;
  bacc_lieu: string;
  dernier_diplome: string;
  diplome_mention: string;
  diplome_lieu: string;
  diplome_annee: number | null;
  type_formation: string;
  diplome_parcours: string;
  photo_url: string;
  pere_nom: string;
  pere_profession: string;
  mere_nom: string;
  mere_profession: string;
  parent_adresse: string;
  parent_contact: string;
  contact_urgence_nom: string;
  contact_urgence_tel: string;
  groupe_sanguin: string;
  renseignements_complementaires: string;
  receipt_no: string;
  receipt_date: string | null;
  receipt_amount: number;
  receipt_url: string;
  active_loans?: number;
}

export interface Borrowing {
  id: number;
  book_id: number;
  member_id: number;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: 'active' | 'returned' | 'overdue';
  notes: string;
  created_at: string;
  updated_at: string;
  books?: Book;
  members?: Member;
}

export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  availableBooks: number;
  newMembersThisMonth: number;
}

