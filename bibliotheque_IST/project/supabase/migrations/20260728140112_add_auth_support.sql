/*
# Add authentication support: user_id + role on members, admin helper, RLS policies

1. Context
   The app now requires authentication. Students self-register (creating a Supabase auth account),
   then log in to see books/history (read-only). An admin manages everything (books, borrowings, members).

2. Modified Tables
   - `members` — added:
     - `user_id` (uuid, references auth.users ON DELETE SET NULL): links a member to their auth account
     - `role` (text, default 'student'): 'student' or 'admin'

3. New Functions
   - `is_admin()` — returns true if the current auth user's member row has role = 'admin'

4. Security (RLS)
   - Books: SELECT public (anon+authenticated); INSERT/UPDATE/DELETE admin-only
   - Categories: SELECT public; INSERT/UPDATE/DELETE admin-only
   - Members: SELECT public (students can see who's registered); INSERT anon+authenticated (self-registration);
     UPDATE/DELETE admin-only
   - Borrowings: SELECT public (students can see history); INSERT/UPDATE/DELETE admin-only
   - All policies are idempotent (DROP IF EXISTS first).

5. Notes
   - The admin user is NOT created here. After deploying, the admin should register via the app,
     then run: UPDATE members SET role = 'admin' WHERE email = 'admin@istd.edu';
   - Students get read-only access to books, borrowings, and members lists.
*/

-- Add user_id and role to members
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';

-- Create is_admin() helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- BOOKS: public read, admin write
-- ============================================================
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read books" ON books;
CREATE POLICY "Anyone can read books" ON books FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can insert books" ON books;
DROP POLICY IF EXISTS "admin_insert_books" ON books;
CREATE POLICY "admin_insert_books" ON books FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can update books" ON books;
DROP POLICY IF EXISTS "admin_update_books" ON books;
CREATE POLICY "admin_update_books" ON books FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can delete books" ON books;
DROP POLICY IF EXISTS "admin_delete_books" ON books;
CREATE POLICY "admin_delete_books" ON books FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- CATEGORIES: public read, admin write
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can insert categories" ON categories;
DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can update categories" ON categories;
DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can delete categories" ON categories;
DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- MEMBERS: public read, self-registration insert, admin write
-- ============================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read members" ON members;
CREATE POLICY "Anyone can read members" ON members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can insert members" ON members;
DROP POLICY IF EXISTS "anon_insert_members" ON members;
CREATE POLICY "anon_insert_members" ON members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update members" ON members;
DROP POLICY IF EXISTS "admin_update_members" ON members;
CREATE POLICY "admin_update_members" ON members FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can delete members" ON members;
DROP POLICY IF EXISTS "admin_delete_members" ON members;
CREATE POLICY "admin_delete_members" ON members FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- BORROWINGS: public read, admin write
-- ============================================================
ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read borrowings" ON borrowings;
CREATE POLICY "Anyone can read borrowings" ON borrowings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can insert borrowings" ON borrowings;
DROP POLICY IF EXISTS "admin_insert_borrowings" ON borrowings;
CREATE POLICY "admin_insert_borrowings" ON borrowings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can update borrowings" ON borrowings;
DROP POLICY IF EXISTS "admin_update_borrowings" ON borrowings;
CREATE POLICY "admin_update_borrowings" ON borrowings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can delete borrowings" ON borrowings;
DROP POLICY IF EXISTS "admin_delete_borrowings" ON borrowings;
CREATE POLICY "admin_delete_borrowings" ON borrowings FOR DELETE
  TO authenticated USING (public.is_admin());
