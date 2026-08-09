# Mise à jour du catalogue — `books` & `categories`

## Ce qui a changé

- **35 nouveaux livres** ajoutés pour passer de 5 à **40 ouvrages** au catalogue, avec un meilleur équilibre des langues (22 en français / 18 en anglais, contre une grosse majorité anglophone avant).
- Nouvelles catégories désormais couvertes par de vrais livres : Mathématiques, BTP, Marketing, Comptabilité & Finance, Langues, Général.
- **Couvertures corrigées** pour tous les livres concernés (certaines ne s'affichaient pas, d'autres montraient une image erronée). Les images sont maintenant hébergées localement dans `api/uploads/covers/` au lieu d'un lien externe peu fiable.

## Ce que tu dois faire

1. **`git pull`** pour récupérer `update_books.sql` et le dossier `api/uploads/covers/` mis à jour.
2. **Vérifier le nom de ton dossier projet local.** Les `cover_url` pointent vers `http://localhost/mon_projet/project/api/uploads/covers/...`. Pour que les images s'affichent, ton dossier local (sous `htdocs`) doit s'appeler exactement `mon_projet/project`. 
3. **Exécuter `update_books.sql`** sur ta base `bibliotheque_ist` :
   - Via phpMyAdmin : onglet **SQL** → coller le contenu du fichier → Exécuter.
   - Ou en ligne de commande :
     ```bash
     mysql -u root -p bibliotheque_ist < update_books.sql
     ```
4. **Rafraîchir l'appli** et vérifier que le catalogue affiche bien 40 livres avec leurs couvertures.

## À savoir — ce script est sans risque pour tes données

- Il ne touche **ni `members` ni `borrowings`** — uniquement `books` et `categories`.
- Il ne fait **aucun `DROP`/`TRUNCATE`/`DELETE`** : c'est un *upsert* (`INSERT ... ON DUPLICATE KEY UPDATE`).
- Chaque livre est identifié par son **ISBN**, pas par son `id`. Si tu as déjà ajouté tes propres livres, aucun risque de conflit ou d'écrasement, même si vos `id` se recoupent.
- **`total_copies` / `available_copies` ne sont jamais modifiés** pour un livre déjà existant chez toi — tes emprunts en cours restent intacts.

## En cas de souci

- Erreur SQL à l'exécution → vérifie que ta base `bibliotheque_ist` est bien sélectionnée avant de lancer le script.
- Images cassées après import → vérifie le point 2 ci-dessus (nom du dossier local), ou dis-le moi pour qu'on passe aux chemins relatifs.
