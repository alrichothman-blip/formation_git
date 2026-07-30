# Bibliothèque de l'IST-D — Installation avec XAMPP

## Étapes d'installation

### 1. Démarrer XAMPP
- Ouvrez le panneau de contrôle XAMPP
- Démarrez **Apache** et **MySQL**

### 2. Importer la base de données
- Ouvrez **phpMyAdmin** (http://localhost/phpmyadmin)
- Cliquez sur **Importer**
- Sélectionnez le fichier `database/library.sql`
- Cliquez sur **Exécuter**

La base de données `bibliotheque_ist` sera créée avec toutes les tables et données de départ.

### 3. Copier le projet dans htdocs
- Copiez tout le dossier du projet dans `C:\xampp\htdocs\bibliotheque-ist`
- Le dossier `api/` doit être accessible à `http://localhost/bibliotheque-ist/api/`

### 4. Configurer l'API (si nécessaire)
Par défaut, l'API utilise:
- Hôte: `localhost`
- Base de données: `bibliotheque_ist`
- Utilisateur: `root`
- Mot de passe: (vide)

Si votre configuration MySQL est différente, modifiez le fichier `api/config.php`.

### 5. Compiler le frontend
```bash
npm install
npm run build
```
Les fichiers compilés seront dans le dossier `dist/`.

### 6. Accéder à l'application
- Frontend compilé: copiez le contenu de `dist/` dans `htdocs/bibliotheque-ist/` (à côté du dossier `api/`)
- Ou en développement: `npm run dev` (le serveur de développement proxy les requêtes API vers localhost)

## Compte administrateur par défaut
- **E-mail:** admin@istd.edu
- **Mot de passe:** admin123

## Structure du projet
```
bibliotheque-ist/
├── api/                  # Backend PHP (API REST)
│   ├── config.php        # Configuration base de données + fonctions utilitaires
│   ├── auth.php          # Authentification (inscription, connexion, déconnexion)
│   ├── books.php         # Gestion des livres (CRUD)
│   ├── categories.php    # Gestion des catégories (CRUD)
│   ├── members.php       # Gestion des étudiants (CRUD)
│   ├── borrowings.php    # Gestion des emprunts (CRUD)
│   ├── dashboard.php     # Statistiques du tableau de bord
│   └── stats.php         # Statistiques détaillées
├── database/
│   └── library.sql       # Fichier SQL à importer dans phpMyAdmin
├── src/                  # Code source React (frontend)
├── dist/                 # Frontend compilé (après npm run build)
└── package.json
```

## Technologies
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** PHP (API REST, sessions)
- **Base de données:** MySQL (via XAMPP / phpMyAdmin)
