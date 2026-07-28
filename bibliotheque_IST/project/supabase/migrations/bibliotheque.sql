-- =========================================================
-- Base de données : bibliotheque_istd
-- Projet : Gestion de la bibliothèque de l'IST-D
-- =========================================================

CREATE DATABASE IF NOT EXISTS bibliotheque_istd
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bibliotheque_istd;

-- ---------------------------------------------------------
-- Table : administrateurs (responsables de la bibliothèque)
-- ---------------------------------------------------------
CREATE TABLE administrateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_utilisateur VARCHAR(50) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compte par défaut -> identifiant : admin / mot de passe : admin123
-- (le mot de passe est haché avec password_hash() de PHP, voir README)
INSERT INTO administrateurs (nom_utilisateur, mot_de_passe) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); -- admin123

-- ---------------------------------------------------------
-- Table : etudiants
-- ---------------------------------------------------------
CREATE TABLE etudiants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    parcours VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telephone VARCHAR(20) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prenom (prenom),
    INDEX idx_nom (nom)
);

-- ---------------------------------------------------------
-- Table : livres
-- ---------------------------------------------------------
CREATE TABLE livres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    auteur VARCHAR(150) NOT NULL,
    categorie VARCHAR(100),
    isbn VARCHAR(30),
    quantite_totale INT NOT NULL DEFAULT 1,
    quantite_disponible INT NOT NULL DEFAULT 1,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_titre (titre)
);

-- ---------------------------------------------------------
-- Table : emprunts
-- ---------------------------------------------------------
CREATE TABLE emprunts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT NOT NULL,
    livre_id INT NOT NULL,
    date_emprunt DATE NOT NULL,
    date_retour_prevue DATE NOT NULL,
    date_retour_effective DATE DEFAULT NULL,
    statut ENUM('en_cours', 'retourne', 'en_retard') NOT NULL DEFAULT 'en_cours',
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
    FOREIGN KEY (livre_id) REFERENCES livres(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- Données d'exemple
-- ---------------------------------------------------------
INSERT INTO etudiants (nom, prenom, parcours, email, telephone, adresse) VALUES
('Randria', 'Toky', 'DTSS-Info', 'toky.randria@example.com', '0341234567', 'Antananarivo'),
('Rakoto', 'Mialy', 'DTSS-Gestion', 'mialy.rakoto@example.com', '0331234567', 'Antananarivo');

INSERT INTO livres (titre, auteur, categorie, isbn, quantite_totale, quantite_disponible) VALUES
('Introduction à PHP et MySQL', 'Jean Dupont', 'Informatique', '978-1234567890', 3, 3),
('Algorithmique fondamentale', 'Marie Laurent', 'Informatique', '978-0987654321', 2, 2);

-- ---------------------------------------------------------
-- Vue : emprunts en retard (facilite le suivi des retards)
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW vue_retards AS
SELECT e.id, s.nom, s.prenom, l.titre, e.date_emprunt, e.date_retour_prevue,
       DATEDIFF(CURDATE(), e.date_retour_prevue) AS jours_retard
FROM emprunts e
JOIN etudiants s ON e.etudiant_id = s.id
JOIN livres l ON e.livre_id = l.id
WHERE e.statut = 'en_cours' AND e.date_retour_prevue < CURDATE();
