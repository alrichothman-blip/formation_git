-- ============================================================
-- Bibliothèque de l'IST-D - Base de données MySQL
-- Compatible XAMPP / phpMyAdmin
-- ============================================================

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS bibliotheque_ist
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bibliotheque_ist;

-- ============================================================
-- Table: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
  icon VARCHAR(100) NOT NULL DEFAULT 'BookOpen',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: books
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  author VARCHAR(500) NOT NULL,
  isbn VARCHAR(50) DEFAULT NULL,
  category_id INT DEFAULT NULL,
  description TEXT,
  cover_url TEXT,
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  published_year INT DEFAULT NULL,
  language VARCHAR(50) DEFAULT 'Français',
  pages INT DEFAULT NULL,
  publisher VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_isbn (isbn),
  CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: members
-- ============================================================
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) DEFAULT '',
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  phone VARCHAR(50) DEFAULT '',
  telephone2 VARCHAR(50) DEFAULT '',
  address TEXT,
  membership_date DATE NOT NULL,
  membership_expiry DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  notes TEXT,
  -- Champs étudiant
  sexe VARCHAR(20) DEFAULT '',
  date_naissance DATE DEFAULT NULL,
  lieu_naissance VARCHAR(255) DEFAULT '',
  nationalite VARCHAR(100) DEFAULT 'Malagasy',
  cin_numero VARCHAR(100) DEFAULT '',
  cin_date DATE DEFAULT NULL,
  cin_lieu VARCHAR(255) DEFAULT '',
  parcours VARCHAR(255) DEFAULT '',
  annee_etude VARCHAR(50) DEFAULT '',
  annee_universitaire VARCHAR(20) DEFAULT '2025-2026',
  statut_etudiant VARCHAR(50) DEFAULT 'Nouveau',
  bacc_serie VARCHAR(100) DEFAULT '',
  bacc_mention VARCHAR(50) DEFAULT '',
  bacc_annee INT DEFAULT NULL,
  bacc_lieu VARCHAR(255) DEFAULT '',
  dernier_diplome VARCHAR(100) DEFAULT '',
  diplome_mention VARCHAR(50) DEFAULT '',
  diplome_lieu VARCHAR(255) DEFAULT '',
  diplome_annee INT DEFAULT NULL,
  type_formation VARCHAR(50) DEFAULT 'Initiale',
  diplome_parcours VARCHAR(255) DEFAULT '',
  photo_url TEXT,
  pere_nom VARCHAR(255) DEFAULT '',
  pere_profession VARCHAR(255) DEFAULT '',
  mere_nom VARCHAR(255) DEFAULT '',
  mere_profession VARCHAR(255) DEFAULT '',
  parent_adresse TEXT,
  parent_contact VARCHAR(100) DEFAULT '',
  contact_urgence_nom VARCHAR(255) DEFAULT '',
  contact_urgence_tel VARCHAR(100) DEFAULT '',
  groupe_sanguin VARCHAR(10) DEFAULT '',
  renseignements_complementaires TEXT,
  receipt_no VARCHAR(100) DEFAULT '',
  receipt_date DATE DEFAULT NULL,
  receipt_amount DECIMAL(12,2) DEFAULT 0,
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: borrowings
-- ============================================================
CREATE TABLE IF NOT EXISTS borrowings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  member_id INT NOT NULL,
  borrow_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_borrow_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  CONSTRAINT fk_borrow_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Données de départ: Catégories
-- ============================================================
INSERT INTO categories (name, color, icon) VALUES
  ('Réseaux & Télécommunications', '#3B82F6', 'Wifi'),
  ('Développement d''Applications', '#10B981', 'Code'),
  ('Mathématiques', '#F59E0B', 'Calculator'),
  ('Électronique', '#EF4444', 'Cpu'),
  ('Sciences Humaines', '#8B5CF6', 'Users'),
  ('Langues', '#EC4899', 'Languages'),
  ('Gestion & Management', '#14B8A6', 'Briefcase'),
  ('Général', '#64748B', 'BookOpen');

-- ============================================================
-- Données de départ: Livres
-- ============================================================
INSERT INTO books (title, author, isbn, category_id, description, published_year, language, pages, publisher, total_copies, available_copies) VALUES
  ('Le Petit Prince', 'Antoine de Saint-Exupéry', '978-2-07-040850-4', 1, 'Un conte poétique et philosophique qui évoque la solitude, l''amitié et l''amour.', 1943, 'Français', 96, 'Gallimard', 5, 5),
  ('Les Misérables', 'Victor Hugo', '978-2-07-040907-5', 1, 'Un roman historique et social majeur de la littérature française.', 1862, 'Français', 1500, 'Gallimard', 3, 3),
  ('Sapiens', 'Yuval Noah Harari', '978-2-07-273233-0', 5, 'Une brève histoire de l''humanité, des origines à nos jours.', 2011, 'Français', 512, 'Albin Michel', 4, 4),
  ('Clean Code', 'Robert C. Martin', '978-0-13-235088-4', 2, 'A Handbook of Agile Software Craftsmanship.', 2008, 'Anglais', 431, 'Prentice Hall', 2, 2),
  ('L''Art de la Guerre', 'Sun Tzu', '978-2-07-036029-8', 5, 'Un traité de stratégie militaire et de philosophie de vie.', 500, 'Français', 128, 'Flammarion', 3, 3);

-- ============================================================
-- Compte administrateur par défaut
-- Email: admin@istd.edu
-- Mot de passe: admin123
-- (Le mot de passe est haché avec password_hash PHP)
-- ============================================================
INSERT INTO members (name, prenom, email, password, role, phone, address, membership_date, membership_expiry, status, parcours, annee_etude)
VALUES ('Administrateur', '', 'admin@istd.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMy.MQDq/1WqjZQj6qVH1mW3gZKjLpQY0m2', 'admin', '', '', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active', '', '');
