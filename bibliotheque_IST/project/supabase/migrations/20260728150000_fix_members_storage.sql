-- Compatibility repair for members storage
-- Makes the members table accept the student registration payload used by the app
-- without changing the UI or business logic.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS prenom text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sexe text DEFAULT '',
  ADD COLUMN IF NOT EXISTS date_naissance date,
  ADD COLUMN IF NOT EXISTS lieu_naissance text DEFAULT '',
  ADD COLUMN IF NOT EXISTS nationalite text DEFAULT 'Malgache',
  ADD COLUMN IF NOT EXISTS cin_numero text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cin_date date,
  ADD COLUMN IF NOT EXISTS cin_lieu text DEFAULT '',
  ADD COLUMN IF NOT EXISTS parcours text DEFAULT '',
  ADD COLUMN IF NOT EXISTS annee_etude text DEFAULT '',
  ADD COLUMN IF NOT EXISTS annee_universitaire text DEFAULT '2025-2026',
  ADD COLUMN IF NOT EXISTS statut_etudiant text DEFAULT 'Nouveau',
  ADD COLUMN IF NOT EXISTS telephone2 text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bacc_serie text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bacc_mention text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bacc_annee integer,
  ADD COLUMN IF NOT EXISTS bacc_lieu text DEFAULT '',
  ADD COLUMN IF NOT EXISTS dernier_diplome text DEFAULT '',
  ADD COLUMN IF NOT EXISTS diplome_mention text DEFAULT '',
  ADD COLUMN IF NOT EXISTS diplome_lieu text DEFAULT '',
  ADD COLUMN IF NOT EXISTS diplome_annee integer,
  ADD COLUMN IF NOT EXISTS type_formation text DEFAULT 'Initiale',
  ADD COLUMN IF NOT EXISTS diplome_parcours text DEFAULT '',
  ADD COLUMN IF NOT EXISTS photo_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pere_nom text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pere_profession text DEFAULT '',
  ADD COLUMN IF NOT EXISTS mere_nom text DEFAULT '',
  ADD COLUMN IF NOT EXISTS mere_profession text DEFAULT '',
  ADD COLUMN IF NOT EXISTS parent_adresse text DEFAULT '',
  ADD COLUMN IF NOT EXISTS parent_contact text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_urgence_nom text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_urgence_tel text DEFAULT '',
  ADD COLUMN IF NOT EXISTS groupe_sanguin text DEFAULT '',
  ADD COLUMN IF NOT EXISTS renseignements_complementaires text DEFAULT '',
  ADD COLUMN IF NOT EXISTS receipt_no text DEFAULT '',
  ADD COLUMN IF NOT EXISTS receipt_date date,
  ADD COLUMN IF NOT EXISTS receipt_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert members" ON members;
DROP POLICY IF EXISTS "anon_insert_members" ON members;
CREATE POLICY "anon_insert_members" ON members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update members" ON members;
DROP POLICY IF EXISTS "admin_update_members" ON members;
CREATE POLICY "admin_update_members" ON members FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

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
