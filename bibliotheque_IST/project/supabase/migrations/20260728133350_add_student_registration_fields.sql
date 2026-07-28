/*
# Add student registration fields to members table

1. Context
   The app is being rebranded as "Bibliothèque de IST" (Institut Supérieur de Technologie d'Antsiranana).
   Students register via a form matching the IST-D inscription form (parcours, année d'étude, CIN, parents, etc.).
   When a student borrows a book, their parcours / nom / email / téléphone / adresse must auto-fill.

2. Modified Tables
   - `members` — added student-specific columns:
     - `prenom` (text): first name(s)
     - `sexe` (text): Masculin / Féminin
     - `date_naissance` (date): date of birth
     - `lieu_naissance` (text): place of birth
     - `nationalite` (text): nationality
     - `cin_numero` (text): national ID number
     - `cin_date` (date): CIN issue date
     - `cin_lieu` (text): CIN issue place
     - `parcours` (text): Réseaux et Télécommunications / Développement d'Applications
     - `annee_etude` (text): 1ère / 2ème / 3ème année
     - `annee_universitaire` (text): e.g. 2025-2026
     - `statut_etudiant` (text): Nouveau / Réinscription
     - `telephone2` (text): secondary phone
     - `bacc_serie` (text): baccalaureat series
     - `bacc_mention` (text): baccalaureat mention
     - `bacc_annee` (int): year of baccalaureat
     - `bacc_lieu` (text): place of baccalaureat
     - `dernier_diplome` (text): last diploma obtained
     - `diplome_mention` (text): diploma mention
     - `diplome_lieu` (text): diploma issue place
     - `diplome_annee` (int): diploma year
     - `type_formation` (text): Initiale / Continue
     - `diplome_parcours` (text): diploma specialty
     - `photo_url` (text): identity photo URL
     - `pere_nom` (text): father's name
     - `pere_profession` (text): father's profession
     - `mere_nom` (text): mother's name
     - `mere_profession` (text): mother's profession
     - `parent_adresse` (text): parents' address
     - `parent_contact` (text): parent phone
     - `contact_urgence_nom` (text): emergency contact name
     - `contact_urgence_tel` (text): emergency contact phone
     - `groupe_sanguin` (text): blood group
     - `renseignements_complementaires` (text): additional info
     - `receipt_no` (text): payment receipt number
     - `receipt_date` (date): payment receipt date
     - `receipt_amount` (numeric): payment amount
     - `receipt_url` (text): payment receipt image URL

   Note: the existing `status` column (active/suspended/expired) represents library membership status
   and is kept separate from `statut_etudiant` (Nouveau/Réinscription).

3. Security
   - RLS already enabled on `members`. Existing anon+authenticated policies remain valid for the new columns.

4. Seed Data
   - Insert default categories for the IST library (if none exist).
*/

-- Add student registration columns to members
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
  ADD COLUMN IF NOT EXISTS receipt_url text DEFAULT '';

-- Seed default categories for IST library
INSERT INTO categories (name, color, icon)
SELECT * FROM (VALUES
  ('Réseaux & Télécommunications', '#3B82F6', 'Wifi'),
  ('Développement d''Applications', '#10B981', 'Code'),
  ('Mathématiques', '#F59E0B', 'Calculator'),
  ('Électronique', '#EF4444', 'Cpu'),
  ('Sciences Humaines', '#8B5CF6', 'Users'),
  ('Langues', '#EC4899', 'Languages'),
  ('Gestion & Management', '#14B8A6', 'Briefcase'),
  ('Général', '#64748B', 'BookOpen')
) AS v(name, color, icon)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);
