/*
  # Library Management System - Complete Schema

  ## Overview
  Full schema for a modern library management system including books, members, categories, and borrowings.

  ## New Tables

  ### categories
  - id (uuid, PK)
  - name (text) - category name
  - color (text) - hex color for UI
  - icon (text) - lucide icon name
  - created_at (timestamptz)

  ### books
  - id (uuid, PK)
  - title (text) - book title
  - author (text) - author name
  - isbn (text, unique) - ISBN number
  - category_id (uuid, FK -> categories)
  - description (text) - book description
  - cover_url (text) - cover image URL
  - total_copies (int) - total copies owned
  - available_copies (int) - copies available to borrow
  - published_year (int) - year published
  - language (text) - book language
  - pages (int) - number of pages
  - publisher (text) - publisher name
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### members
  - id (uuid, PK)
  - name (text) - full name
  - email (text, unique) - email address
  - phone (text) - phone number
  - address (text) - address
  - membership_date (date) - when they joined
  - membership_expiry (date) - when membership expires
  - status (text) - active/suspended/expired
  - avatar_url (text) - profile picture
  - notes (text) - internal notes
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### borrowings
  - id (uuid, PK)
  - book_id (uuid, FK -> books)
  - member_id (uuid, FK -> members)
  - borrow_date (date) - when borrowed
  - due_date (date) - when due back
  - return_date (date) - when actually returned (null if still out)
  - status (text) - active/returned/overdue
  - notes (text) - librarian notes
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Public read/write access for demo purposes (anon role)
*/

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  icon text NOT NULL DEFAULT 'BookOpen',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert categories"
  ON categories FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
  ON categories FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete categories"
  ON categories FOR DELETE
  TO anon, authenticated
  USING (true);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text UNIQUE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  total_copies integer NOT NULL DEFAULT 1,
  available_copies integer NOT NULL DEFAULT 1,
  published_year integer,
  language text DEFAULT 'Français',
  pages integer,
  publisher text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read books"
  ON books FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert books"
  ON books FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update books"
  ON books FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete books"
  ON books FOR DELETE
  TO anon, authenticated
  USING (true);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  address text DEFAULT '',
  membership_date date NOT NULL DEFAULT CURRENT_DATE,
  membership_expiry date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  status text NOT NULL DEFAULT 'active',
  avatar_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read members"
  ON members FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert members"
  ON members FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update members"
  ON members FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete members"
  ON members FOR DELETE
  TO anon, authenticated
  USING (true);

-- Borrowings table
CREATE TABLE IF NOT EXISTS borrowings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  borrow_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  return_date date,
  status text NOT NULL DEFAULT 'active',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read borrowings"
  ON borrowings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert borrowings"
  ON borrowings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update borrowings"
  ON borrowings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete borrowings"
  ON borrowings FOR DELETE
  TO anon, authenticated
  USING (true);

-- Seed default categories
INSERT INTO categories (name, color, icon) VALUES
  ('Roman', '#3B82F6', 'BookOpen'),
  ('Science', '#10B981', 'Flask'),
  ('Histoire', '#F59E0B', 'Globe'),
  ('Informatique', '#6366F1', 'Monitor'),
  ('Art & Culture', '#EC4899', 'Palette'),
  ('Jeunesse', '#F97316', 'Star'),
  ('Philosophie', '#8B5CF6', 'Brain'),
  ('Biographie', '#14B8A6', 'User')
ON CONFLICT DO NOTHING;

-- Seed sample books
INSERT INTO books (title, author, isbn, category_id, description, published_year, language, pages, publisher, total_copies, available_copies)
SELECT
  'Le Petit Prince', 'Antoine de Saint-Exupéry', '978-2-07-040850-4',
  (SELECT id FROM categories WHERE name = 'Roman' LIMIT 1),
  'Un conte poétique et philosophique qui évoque la solitude, l''amitié et l''amour.',
  1943, 'Français', 96, 'Gallimard', 5, 5
WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = '978-2-07-040850-4');

INSERT INTO books (title, author, isbn, category_id, description, published_year, language, pages, publisher, total_copies, available_copies)
SELECT
  'Les Misérables', 'Victor Hugo', '978-2-07-040907-5',
  (SELECT id FROM categories WHERE name = 'Roman' LIMIT 1),
  'Un roman historique et social majeur de la littérature française.',
  1862, 'Français', 1500, 'Gallimard', 3, 3
WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = '978-2-07-040907-5');

INSERT INTO books (title, author, isbn, category_id, description, published_year, language, pages, publisher, total_copies, available_copies)
SELECT
  'Sapiens', 'Yuval Noah Harari', '978-2-07-273233-0',
  (SELECT id FROM categories WHERE name = 'Histoire' LIMIT 1),
  'Une brève histoire de l''humanité, des origines à nos jours.',
  2011, 'Français', 512, 'Albin Michel', 4, 4
WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = '978-2-07-273233-0');

INSERT INTO books (title, author, isbn, category_id, description, published_year, language, pages, publisher, total_copies, available_copies)
SELECT
  'Clean Code', 'Robert C. Martin', '978-0-13-235088-4',
  (SELECT id FROM categories WHERE name = 'Informatique' LIMIT 1),
  'A Handbook of Agile Software Craftsmanship.',
  2008, 'Anglais', 431, 'Prentice Hall', 2, 2
WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = '978-0-13-235088-4');

INSERT INTO books (title, author, isbn, category_id, description, published_year, language, pages, publisher, total_copies, available_copies)
SELECT
  'L''Art de la Guerre', 'Sun Tzu', '978-2-07-036029-8',
  (SELECT id FROM categories WHERE name = 'Philosophie' LIMIT 1),
  'Un traité de stratégie militaire et de philosophie de vie.',
  500, 'Français', 128, 'Flammarion', 3, 3
WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = '978-2-07-036029-8');
