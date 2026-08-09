-- =====================================================================
-- update_books.sql -- Synchronisation catalogue bibliotheque_ist
-- Genere le 09/08/2026
--
-- CE SCRIPT EST NON DESTRUCTIF :
--  - Il ne fait AUCUN DROP / TRUNCATE / DELETE.
--  - Chaque livre est identifie par son ISBN (cle unique), PAS par son id.
--    -> Si un collegue a deja ajoute ses propres livres avec d'autres id,
--       aucun risque d'ecrasement : seul un ISBN identique declenche une mise a jour.
--  - available_copies / total_copies ne sont JAMAIS modifies pour un livre
--    deja existant, afin de ne pas fausser les emprunts en cours chez le collegue.
--  - Les categories sont synchronisees par id (table de reference fixe).
--
-- A COMPRENDRE AVANT D'EXECUTER :
--  Les cover_url pointent vers http://localhost/mon_projet/project/api/uploads/covers/...
--  Ce chemin est local a TA machine : les fichiers images ne sont pas dans ce .sql.
--  Pour que les couvertures s'affichent aussi chez ton collegue, il faut EN PLUS
--  partager le dossier api/uploads/covers/ (via Git, un zip, un drive partage, etc.)
--  et le placer au meme chemin relatif chez lui.
-- =====================================================================

START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1) Categories (upsert par id)
-- ---------------------------------------------------------------------
INSERT INTO `categories` (`id`, `name`, `color`, `icon`, `created_at`) VALUES
(1, 'Réseaux & Télécommunications', '#3B82F6', 'Wifi', '2026-08-01 23:07:56'),
(2, 'Développement d\'Applications', '#10B981', 'Code', '2026-08-01 23:07:56'),
(3, 'Mathématiques', '#F59E0B', 'Calculator', '2026-08-01 23:07:56'),
(4, 'Électronique', '#EF4444', 'Cpu', '2026-08-01 23:07:56'),
(5, 'Sciences Humaines', '#8B5CF6', 'Users', '2026-08-01 23:07:56'),
(6, 'Langues', '#EC4899', 'Languages', '2026-08-01 23:07:56'),
(7, 'Gestion & Management', '#14B8A6', 'Briefcase', '2026-08-01 23:07:56'),
(8, 'Général', '#64748B', 'BookOpen', '2026-08-01 23:07:56'),
(9, 'Management & Gestion', '#F59E0B', 'Briefcase', '2026-08-08 21:03:49'),
(10, 'Sciences', '#06B6D4', 'Atom', '2026-08-08 21:03:49'),
(11, 'Litterature', '#EC4899', 'BookOpen', '2026-08-08 21:03:49'),
(12, 'Electronique', '#EAB308', 'Cpu', '2026-08-08 21:17:14'),
(13, 'BTP', '#78716C', 'HardHat', '2026-08-08 21:17:14'),
(14, 'Marketing', '#F97316', 'Megaphone', '2026-08-08 21:17:14'),
(15, 'Comptabilite & Finance', '#22C55E', 'Calculator', '2026-08-08 21:17:14')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `color` = VALUES(`color`),
  `icon` = VALUES(`icon`);

-- ---------------------------------------------------------------------
-- 2) Livres (upsert par isbn -- jamais par id)
-- ---------------------------------------------------------------------
INSERT INTO `books` (`title`, `author`, `isbn`, `category_id`, `description`, `cover_url`, `total_copies`, `available_copies`, `published_year`, `language`, `pages`, `publisher`, `created_at`, `updated_at`) VALUES
('Le Petit Prince', 'Antoine de Saint-Exupéry', '978-2-07-040850-4', 11, 'Un conte poétique et philosophique qui évoque la solitude, l\'amitié et l\'amour.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_3f8e9ae5e6f93dc5.jpg', 5, 5, 1943, 'Français', 96, 'Gallimard', '2026-08-01 23:07:56', '2026-08-09 14:04:36'),
('Les Misérables', 'Victor Hugo', '978-2-07-040907-5', 11, 'Un roman historique et social majeur de la littérature française.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_2900da4c345a1908.jpg', 3, 3, 1862, 'Français', 1500, 'Gallimard', '2026-08-01 23:07:56', '2026-08-09 14:36:34'),
('Sapiens', 'Yuval Noah Harari', '978-2-07-273233-0', 5, 'Une brève histoire de l\'humanité, des origines à nos jours.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_010528fe3bb4fcac.jpg', 4, 4, 2011, 'Français', 512, 'Albin Michel', '2026-08-01 23:07:56', '2026-08-09 14:36:38'),
('Clean Code', 'Robert C. Martin', '978-0-13-235088-4', 2, 'A Handbook of Agile Software Craftsmanship.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_7f86e231828434c3.jpg', 2, 2, 2008, 'Anglais', 431, 'Prentice Hall', '2026-08-01 23:07:56', '2026-08-09 14:04:43'),
('L\'Art de la Guerre', 'Sun Tzu', '978-2-07-036029-8', 5, 'Un traité de stratégie militaire et de philosophie de vie.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_8285e408bb44958a.jpg', 3, 3, 500, 'Français', 128, 'Flammarion', '2026-08-01 23:07:56', '2026-08-09 14:36:42'),
('Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', '9780262046305', 2, 'Reference universitaire sur la conception, l\'analyse et la complexite des algorithmes.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_42a205196913b515.jpg', 2, 2, 2022, 'Anglais', 1312, 'MIT Press', '2026-08-08 21:05:50', '2026-08-09 14:04:48'),
('Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', '9780201633610', 2, 'Catalogue fondateur des patrons de conception en programmation orientee objet.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_5e47609105f5edcf.jpg', 2, 2, 1994, 'Anglais', 395, 'Addison-Wesley', '2026-08-08 21:05:50', '2026-08-09 14:04:51'),
('The Pragmatic Programmer', 'Andrew Hunt, David Thomas', '9780135957059', 2, 'Recueil de bonnes pratiques et d\'etat d\'esprit pour ecrire du code durable.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_f15dd8ccea2d232e.jpg', 3, 3, 2019, 'Anglais', 352, 'Addison-Wesley', '2026-08-08 21:05:50', '2026-08-09 14:04:55'),
('Eloquent JavaScript', 'Marijn Haverbeke', '9781593279509', 2, 'Introduction moderne et complete au langage JavaScript, du navigateur a Node.js.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_2e72fc0be457adc4.jpg', 3, 3, 2018, 'Anglais', 472, 'No Starch Press', '2026-08-08 21:05:50', '2026-08-09 14:04:59'),
('Computer Networking: A Top-Down Approach', 'James F. Kurose, Keith W. Ross', '9780133594140', 1, 'Manuel de reference sur les reseaux informatiques, de la couche application au materiel.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_7a7d2108c67aa843.jpg', 2, 2, 2016, 'Anglais', 864, 'Pearson', '2026-08-08 21:05:50', '2026-08-09 14:05:03'),
('TCP/IP Illustrated, Volume 1: The Protocols', 'W. Richard Stevens', '9780201633467', 1, 'Description detaillee du fonctionnement des protocoles TCP/IP.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_8df9d2068b183f05.jpg', 2, 2, 1994, 'Anglais', 576, 'Addison-Wesley', '2026-08-08 21:05:50', '2026-08-09 14:09:03'),
('A Guide to the Project Management Body of Knowledge (PMBOK Guide)', 'Project Management Institute', '9781628256642', 9, 'Standard de reference internationale en gestion de projet.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_b7425641ad0d4a62.jpg', 2, 2, 2021, 'Anglais', 250, 'Project Management Institute', '2026-08-08 21:05:50', '2026-08-09 14:05:09'),
('Scrum: The Art of Doing Twice the Work in Half the Time', 'Jeff Sutherland', '9780385346450', 9, 'Presentation de la methode Scrum par l\'un de ses createurs.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_2f09b05d50389281.jpg', 2, 2, 2014, 'Anglais', 256, 'Crown Business', '2026-08-08 21:05:50', '2026-08-09 14:05:13'),
('The Lean Startup', 'Eric Ries', '9780307887894', 9, 'Methode de gestion de projet et d\'entrepreneuriat par iteration rapide.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_e95209c2950658fe.jpg', 2, 2, 2011, 'Anglais', 336, 'Crown Business', '2026-08-08 21:05:50', '2026-08-09 14:05:17'),
('A Brief History of Time', 'Stephen Hawking', '9780553380163', 10, 'Vulgarisation de la cosmologie moderne, du Big Bang aux trous noirs.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_378f54ca1d121177.jpg', 2, 2, 1998, 'Anglais', 212, 'Bantam', '2026-08-08 21:05:50', '2026-08-09 14:05:18'),
('Cosmos', 'Carl Sagan', '9780345539434', 10, 'Grand classique de vulgarisation sur l\'astronomie et la place de l\'humanite dans l\'univers.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_9bd5fb8005d59eff.jpg', 2, 2, 2013, 'Anglais', 384, 'Ballantine Books', '2026-08-08 21:05:50', '2026-08-09 14:05:22'),
('Silent Spring', 'Rachel Carson', '9780618249060', 10, 'Ouvrage fondateur du mouvement environnemental moderne sur l\'impact des pesticides.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_51e91c79b157f034.jpg', 2, 2, 2002, 'Anglais', 378, 'Mariner Books', '2026-08-08 21:05:50', '2026-08-09 14:05:24'),
('The Sixth Extinction: An Unnatural History', 'Elizabeth Kolbert', '9781250062185', 10, 'Enquete sur la sixieme extinction de masse et son lien avec l\'activite humaine.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_28f2917c60145396.jpg', 2, 2, 2015, 'Anglais', 336, 'Picador', '2026-08-08 21:05:50', '2026-08-09 14:05:26'),
('Homo Deus: A Brief History of Tomorrow', 'Yuval Noah Harari', '9780062464316', 5, 'Reflexion sur l\'avenir de l\'humanite face a la biotechnologie et l\'intelligence artificielle.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_d1702769aeef9fef.jpg', 3, 3, 2017, 'Anglais', 464, 'Harper', '2026-08-08 21:05:50', '2026-08-09 14:05:29'),
('Factfulness', 'Hans Rosling', '9781250107817', 5, 'Dix reflexes de pensee pour mieux comprendre l\'etat reel du monde avec des donnees.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_8ce942f251b1a08d.jpg', 2, 2, 2018, 'Anglais', 342, 'Flatiron Books', '2026-08-08 21:05:50', '2026-08-09 14:05:33'),
('L\'Étranger', 'Albert Camus', '9782070360024', 11, 'Roman existentialiste de Camus sur l\'absurdite de la condition humaine.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_83c686ac85c59818.jpg', 3, 3, 1957, 'Français', 186, 'Gallimard', '2026-08-08 21:05:50', '2026-08-09 14:05:36'),
('Candide', 'Voltaire', '9782070413119', 11, 'Conte philosophique satirique sur l\'optimisme, publie en 1759.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_546a3c248a5f1144.jpg', 3, 3, 1972, 'Français', 118, 'Gallimard', '2026-08-08 21:05:50', '2026-08-09 14:05:40'),
('1984', 'George Orwell', '9780451524935', 11, 'Dystopie de reference sur la surveillance totalitaire et le controle de l\'information.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_3be0930b31416fea.jpg', 3, 3, 1961, 'Anglais', 328, 'Signet Classics', '2026-08-08 21:05:50', '2026-08-09 14:05:43'),
('Les Réseaux', 'Guy Pujolle', '9782212128789', 1, 'Référence francophone incontournable en réseaux et télécommunications, de Ethernet aux réseaux mobiles.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_4a980634da49bd5e.jpg', 2, 2, 2011, 'Français', 774, 'Eyrolles', '2026-08-09 06:00:00', '2026-08-09 14:31:22'),
('Réseaux & Télécoms : cours avec 129 exercices corrigés', 'Claude Servin', '9782100526260', 1, 'Cours complet sur les technologies réseaux et télécoms, avec exercices corrigés, pour écoles d\'ingénieurs et IUT.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_6c6e8c9fa597ad76.webp', 2, 2, 2006, 'Français', 938, 'Dunod', '2026-08-09 06:00:00', '2026-08-09 15:02:12'),
('Apprendre à programmer avec Python 3', 'Gérard Swinnen', '9782212134346', 2, 'Introduction progressive et pédagogique à la programmation à travers le langage Python.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_5e6671c97e7f2530.jpg', 3, 3, 2012, 'Français', 436, 'Eyrolles', '2026-08-09 06:00:00', '2026-08-09 14:31:27'),
('Le Langage C - Norme ANSI', 'Brian W. Kernighan, Dennis M. Ritchie', '9782100715770', 2, 'Traduction française de l\'ouvrage de référence des créateurs du langage C, connu sous l\'abréviation K&R.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_bec82df7e8af539b.jpg', 2, 2, 2014, 'Français', 280, 'Dunod', '2026-08-09 06:00:00', '2026-08-09 14:05:50'),
('Le Théorème du Perroquet', 'Denis Guedj', '9782020300445', 3, 'Roman qui mêle enquête policière et histoire des mathématiques pour découvrir les grands théorèmes autrement.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_8d538e774905e4f1.jpg', 2, 2, 1998, 'Français', 521, 'Seuil', '2026-08-09 06:00:00', '2026-08-09 14:05:53'),
('Le Fascinant Nombre Pi', 'Jean-Paul Delahaye', '9782410014457', 3, 'Voyage à travers l\'histoire mathématique et informatique du nombre Pi, de l\'Antiquité au calcul de ses décimales.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_48a0b8915e2b8791.jpg', 2, 2, 2018, 'Français', 384, 'Belin', '2026-08-09 06:00:00', '2026-08-09 14:36:50'),
('Électronique : composants et systèmes d\'application', 'Thomas L. Floyd', '9782893772134', 12, 'Manuel détaillé sur les composants électroniques et les circuits, avec applications pratiques et dépannage.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_df2a1bd94b1bb5c2.jpeg', 2, 2, 2005, 'Français', 1054, 'Reynald Goulet / Eyrolles', '2026-08-09 06:00:00', '2026-08-09 15:06:47'),
('Conception et calcul des structures de bâtiment - Tome 1', 'Henry Thonier', '9782859783068', 13, 'Ouvrage de référence en génie civil sur la conception des structures de bâtiment, conforme aux règles BAEL/BPEL.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_df48861722b2fb39.jpg', 2, 2, 1996, 'Français', 600, 'Presses de l\'École Nationale des Ponts et Chaussées', '2026-08-09 06:00:00', '2026-08-09 14:05:58'),
('Le Management : voyage au centre des organisations', 'Henry Mintzberg', '9782708130937', 9, 'Synthèse accessible des travaux de Mintzberg sur le rôle des managers et les structures des organisations.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_031e3a9650e4f911.jpg', 2, 2, 2004, 'Français', 667, 'Eyrolles - Éditions d\'Organisation', '2026-08-09 06:00:00', '2026-08-09 14:36:57'),
('Marketing Management', 'Philip Kotler, Kevin Lane Keller, Delphine Manceau', '9782326001084', 14, 'Best-seller mondial du marketing, adapté au contexte français et européen, référence des écoles de commerce.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_69e54a91d5439f48.jpg', 2, 2, 2017, 'Français', 877, 'Pearson France', '2026-08-09 06:00:00', '2026-08-09 14:49:13'),
('Le Marketing pour les Nuls', 'Alexander Hiam, Benoît Heilbrunn', '9782412066690', 14, 'Introduction claire et pédagogique aux concepts et outils du marketing stratégique et opérationnel.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_32d16e7a2e56ed2a.jpg', 3, 3, 2021, 'Français', 454, 'First Éditions', '2026-08-09 06:00:00', '2026-08-09 14:06:04'),
('Comptabilité générale', 'Béatrice Grandguillot, Francis Grandguillot', '9782297268943', 15, 'Synthèse structurée des principes et techniques de comptabilisation des opérations courantes et de fin d\'exercice.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_fcbaace4d36b0e22.jpg', 3, 3, 2024, 'Français', 387, 'Gualino', '2026-08-09 06:00:00', '2026-08-09 14:49:18'),
('Finance d\'entreprise', 'Pierre Vernimmen, Pascal Quiry, Yann Le Fur', '9782247230402', 15, 'Ouvrage de référence du marché francophone en finance d\'entreprise : diagnostic financier, investissements, marchés.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_624f8438661bc2f5.jpg', 2, 2, 2025, 'Français', 1199, 'Dalloz', '2026-08-09 06:00:00', '2026-08-09 14:49:22'),
('Bescherelle - La conjugaison pour tous', 'Collectif', '9782218951985', 6, 'Ouvrage de référence pour comprendre et conjuguer tous les verbes de la langue française.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_d694a5433e01d6f9.jpg', 4, 4, 2012, 'Français', 256, 'Hatier', '2026-08-09 06:00:00', '2026-08-09 14:06:10'),
('English Grammar in Use', 'Raymond Murphy', '9781108457651', 6, 'Ouvrage de référence pour l\'apprentissage autonome de la grammaire anglaise, niveau intermédiaire (B1-B2).', 'http://localhost/mon_projet/project/api/uploads/covers/cover_1c3366f89660baba.jpg', 3, 3, 2019, 'Anglais', 390, 'Cambridge University Press', '2026-08-09 06:00:00', '2026-08-09 14:06:13'),
('Traduit de la nuit', 'Jean-Joseph Rabearivelo', '9782842801250', 11, 'Recueil de poèmes du plus grand écrivain malgache, écrits directement en français et en malgache.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_10cd6f24b1b82ed1.jpg', 2, 2, 2007, 'Français', 80, 'Sépia', '2026-08-09 06:00:00', '2026-08-09 14:06:18'),
('Le Petit Larousse illustré 2026', 'Larousse (Collectif)', '9782036022256', 8, 'Dictionnaire encyclopédique de référence de la langue française : noms communs, noms propres et compléments encyclopédiques.', 'http://localhost/mon_projet/project/api/uploads/covers/cover_ae0fe74d75ac4201.jpg', 2, 2, 2025, 'Français', 2048, 'Larousse', '2026-08-09 06:00:00', '2026-08-09 14:37:11')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `author` = VALUES(`author`),
  `category_id` = VALUES(`category_id`),
  `description` = VALUES(`description`),
  `cover_url` = VALUES(`cover_url`),
  `published_year` = VALUES(`published_year`),
  `language` = VALUES(`language`),
  `pages` = VALUES(`pages`),
  `publisher` = VALUES(`publisher`);

COMMIT;
