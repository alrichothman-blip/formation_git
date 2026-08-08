<?php

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/secrets.php'; // définit GROQ_API_KEY — voir secrets.php.example, ne JAMAIS commiter secrets.php

// --- Tout passe par Groq : un modèle rapide pour le stock, un plus complet pour les recommandations ---
// Vérifie les noms exacts sur console.groq.com/docs/models si besoin
define('GROQ_MODEL_RAPIDE', 'llama-3.1-8b-instant');
define('GROQ_MODEL_EXPERT', 'llama-3.3-70b-versatile');
define('GROQ_URL', 'https://api.groq.com/openai/v1/chat/completions');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
  json_error('Méthode non supportée', 405);
}

$body = get_body();
$message = trim($body['message'] ?? '');
$historique = is_array($body['historique'] ?? null) ? $body['historique'] : [];

if ($message === '') {
  json_error('Le message ne peut pas être vide');
}

if (mb_strlen($message) > 500) {
  json_error('Message trop long (500 caractères maximum)');
}

$user = is_authenticated();
$messageNormalise = mb_strtolower($message);

function containsAny(string $haystack, array $needles): bool {
  foreach ($needles as $needle) {
    if (mb_stripos($haystack, $needle) !== false) {
      return true;
    }
  }
  return false;
}

function buildBorrowingSummary(array $borrowings, string $label): string {
  if (empty($borrowings)) {
    return "Aucun emprunt {$label} n'a été trouvé.";
  }

  $lines = ["Emprunts {$label} ({count} trouvés) :"]; // placeholder count replaced later
  foreach ($borrowings as $bw) {
    $member = trim($bw['members']['prenom'] . ' ' . $bw['members']['name']);
    $lines[] = sprintf(
      '- %s ("%s") emprunté par %s le %s, dû le %s.',
      $bw['books']['title'],
      $bw['books']['author'],
      $member,
      $bw['borrow_date'],
      $bw['due_date']
    );
  }
  $summary = implode("\n", $lines);
  return str_replace('{count}', (string)count($borrowings), $summary);
}

function fetchAdminBorrowings(string $status): array {
  $today = date('Y-m-d');

  if ($status === 'active') {
    $stmt = db()->prepare('SELECT bw.*, b.title AS book_title, b.author AS book_author, b.isbn AS book_isbn, b.cover_url AS book_cover_url, b.available_copies AS book_available_copies, c.color AS book_category_color, m.name AS member_name, m.prenom AS member_prenom, m.email AS member_email, m.phone AS member_phone, m.address AS member_address, m.parcours AS member_parcours, m.annee_etude AS member_annee_etude FROM borrowings bw JOIN books b ON bw.book_id = b.id LEFT JOIN categories c ON b.category_id = c.id JOIN members m ON bw.member_id = m.id WHERE bw.return_date IS NULL AND bw.due_date >= ? ORDER BY bw.borrow_date DESC');
    $stmt->execute([$today]);
  } elseif ($status === 'overdue') {
    $stmt = db()->prepare('SELECT bw.*, b.title AS book_title, b.author AS book_author, b.isbn AS book_isbn, b.cover_url AS book_cover_url, b.available_copies AS book_available_copies, c.color AS book_category_color, m.name AS member_name, m.prenom AS member_prenom, m.email AS member_email, m.phone AS member_phone, m.address AS member_address, m.parcours AS member_parcours, m.annee_etude AS member_annee_etude FROM borrowings bw JOIN books b ON bw.book_id = b.id LEFT JOIN categories c ON b.category_id = c.id JOIN members m ON bw.member_id = m.id WHERE bw.return_date IS NULL AND bw.due_date < ? ORDER BY bw.due_date ASC');
    $stmt->execute([$today]);
  } elseif ($status === 'returned') {
    $stmt = db()->query('SELECT bw.*, b.title AS book_title, b.author AS book_author, b.isbn AS book_isbn, b.cover_url AS book_cover_url, b.available_copies AS book_available_copies, c.color AS book_category_color, m.name AS member_name, m.prenom AS member_prenom, m.email AS member_email, m.phone AS member_phone, m.address AS member_address, m.parcours AS member_parcours, m.annee_etude AS member_annee_etude FROM borrowings bw JOIN books b ON bw.book_id = b.id LEFT JOIN categories c ON b.category_id = c.id JOIN members m ON bw.member_id = m.id WHERE bw.return_date IS NOT NULL ORDER BY bw.return_date DESC');
  } else {
    return [];
  }

  $borrowings = $stmt->fetchAll();
  $result = [];
  foreach ($borrowings as $bw) {
    $result[] = [
      'borrow_date' => $bw['borrow_date'],
      'due_date' => $bw['due_date'],
      'books' => [
        'title' => $bw['book_title'],
        'author' => $bw['book_author'],
      ],
      'members' => [
        'prenom' => $bw['member_prenom'],
        'name' => $bw['member_name'],
      ],
    ];
  }
  return $result;
}

// Greeting / identity handling
$salutations = ['bonjour', 'bonsoir', 'salut', 'coucou', 'hey', 'hello'];
$identite = ['qui es tu', 'qui es-tu', 'quel est ton nom', 'comment tu t\'appelles', 'présente toi', 'présente-toi', 'c\'est qui'];
$adminFilterPhrases = [
  'filtrer les emprunts en cours', 'emprunts en cours', 'afficher les emprunts en cours', 'liste des emprunts en cours', 'emprunts actifs', 'actifs',
  'livres retournés', 'emprunts retournés', 'retournés', 'retournee', 'retournees',
  'en retard', 'retardataire', 'retard', 'emprunts en retard',
];

if (containsAny($messageNormalise, $salutations) || containsAny($messageNormalise, $identite)) {
  $reponse = "Bonjour ! Je suis Libris AI, l'assistant virtuel de la bibliothèque de l'ISTD. "
    . "Je peux vous aider à chercher des livres, vérifier leur disponibilité et, si vous êtes administrateur, filtrer les emprunts. "
    . "Si vous voulez voir les emprunts en cours, les livres retournés ou les retardataires, dites-le-moi simplement. ";

  json_response(['reponse' => $reponse, 'modele_utilise' => 'local']);
}

// Admin borrowing filters
if (containsAny($messageNormalise, $adminFilterPhrases)) {
  if (!$user || $user['role'] !== 'admin') {
    json_response([
      'reponse' => 'Cette commande est réservée aux administrateurs. Connectez-vous avec un compte admin pour voir les emprunts en cours, les livres retournés ou les retardataires.',
      'modele_utilise' => 'local',
    ]);
  }

  if (containsAny($messageNormalise, ['filtrer les emprunts en cours', 'emprunts en cours', 'afficher les emprunts en cours', 'liste des emprunts en cours', 'emprunts actifs', 'actifs'])) {
    $borrowings = fetchAdminBorrowings('active');
    json_response(['reponse' => buildBorrowingSummary($borrowings, 'en cours'), 'modele_utilise' => 'local']);
  }
  if (containsAny($messageNormalise, ['livres retournés', 'emprunts retournés', 'retournés', 'retournee', 'retournees'])) {
    $borrowings = fetchAdminBorrowings('returned');
    json_response(['reponse' => buildBorrowingSummary($borrowings, 'retournés'), 'modele_utilise' => 'local']);
  }
  if (containsAny($messageNormalise, ['en retard', 'retardataire', 'retard', 'emprunts en retard'])) {
    $borrowings = fetchAdminBorrowings('overdue');
    json_response(['reponse' => buildBorrowingSummary($borrowings, 'en retard'), 'modele_utilise' => 'local']);
  }
}

// --- 1. Routeur : stock vs recommandation (détermine la stratégie de données, pas le moteur) ---
$motsClesStock = ['disponible', 'dispo', 'reste', 'stock', 'emprunter', 'où est', 'ou est', 'rayon'];
$estRequeteStock = false;
foreach ($motsClesStock as $mot) {
  if (mb_stripos($message, $mot) !== false) {
    $estRequeteStock = true;
    break;
  }
}

// --- 2. Données du catalogue : stratégie différente selon le type de requête ---
$livresContexte = [];

$estListeGenerale = false;

if ($estRequeteStock) {
  // Vérification de stock : l'utilisateur nomme un livre précis, une recherche par mot-clé a du sens
  $stopwords = ['le', 'la', 'les', 'de', 'des', 'un', 'une', 'du', 'est', 'ce', 'que', 'qui', 'quel', 'quels', 'quelle', 'quelles', 'sont',
    'avez', 'vous', 'sur', 'pour', 'avec', 'dans', 'moi', 'est-ce', 'livre', 'livres',
    'disponible', 'disponibles', 'dispo', 'reste', 'stock', 'emprunter', 'rayon'];

  $mots = preg_split('/[\s,.?!]+/u', mb_strtolower($message), -1, PREG_SPLIT_NO_EMPTY);
  $motsCles = array_values(array_diff($mots, $stopwords));
  $motsCles = array_values(array_filter($motsCles, fn($m) => mb_strlen($m) >= 4));
  $motsCles = array_slice($motsCles, 0, 5);

  if (!empty($motsCles)) {
    $conditions = [];
    $params = [];
    foreach ($motsCles as $mot) {
      $conditions[] = '(b.title LIKE ? OR b.author LIKE ?)';
      $params[] = '%' . $mot . '%';
      $params[] = '%' . $mot . '%';
    }
    $sql = '
      SELECT b.title, b.author, b.description, b.available_copies, b.total_copies, c.name AS categorie
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      WHERE ' . implode(' OR ', $conditions) . '
      LIMIT 5
    ';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $livresContexte = $stmt->fetchAll();
  }

  // Filet de secours : aucun titre precis identifiable (ex: "quels livres sont disponibles ?").
  // Plutot que de laisser le modele sans aucune donnee, on bascule sur un apercu general.
  if (empty($livresContexte)) {
    $estListeGenerale = true;
    $stmt = db()->query('
      SELECT b.title, b.author, b.description, b.available_copies, b.total_copies, c.name AS categorie
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      WHERE b.available_copies > 0
      ORDER BY b.title
      LIMIT 15
    ');
    $livresContexte = $stmt->fetchAll();
  }
} else {
  // Recommandation : la recherche par mot-clé ne comprend pas le sens (français vs descriptions en
  // anglais, synonymes...). On donne tout le catalogue et on laisse le modèle juger la pertinence lui-même.
  $stmt = db()->query('
    SELECT b.title, b.author, b.description, b.available_copies, b.total_copies, c.name AS categorie
    FROM books b
    LEFT JOIN categories c ON c.id = b.category_id
    ORDER BY b.id
    LIMIT 40
  ');
  $livresContexte = $stmt->fetchAll();
}

// --- 3. Construction du prompt système ---
$cadre = "Tu es Libris AI, l'assistant de la bibliotheque de l'ISTD. "
  . "Tu aides a trouver un livre, verifier sa disponibilite, ou recommander une lecture "
  . "UNIQUEMENT a partir de la liste de livres du catalogue fournie ci-dessous. "
  . "Tu ne dois JAMAIS mentionner ou recommander un livre qui n'est pas dans cette liste, "
  . "meme si tu le connais par ailleurs : si la liste est vide ou ne correspond pas au sujet demande, "
  . "dis-le clairement plutot que d'inventer un titre. "
  . "Si on te demande autre chose qu'un livre (devoirs, code, actualite, discussion generale), "
  . "reponds seulement : \"Je suis desole, je ne peux repondre qu'aux questions concernant la bibliotheque de l'ISTD.\"\n\n";

if ($estListeGenerale) {
  $systemPrompt = $cadre
    . "L'utilisateur demande un apercu general des livres disponibles, pas un titre precis. "
    . "Presente une courte liste (titres et auteurs) a partir du catalogue ci-dessous, en 4-5 lignes maximum.";
} elseif ($estRequeteStock) {
  $systemPrompt = $cadre
    . "Reponds tres brievement, en une phrase, a partir des donnees fournies sur la disponibilite des livres.";
} else {
  $systemPrompt = $cadre
    . "Voici le catalogue complet de la bibliotheque ci-dessous (titre, auteur, description, categorie). "
    . "Recommande un livre UNIQUEMENT s'il correspond vraiment au sujet demande, en te basant sur sa "
    . "description et sa categorie, meme si le mot exact n'apparait pas dans le titre. "
    . "Un livre juste vaguement lie ne compte pas : dans ce cas, dis clairement qu'aucun livre du "
    . "catalogue ne correspond a ce sujet precis. "
    . "Reponds en 2 phrases maximum, puis arrete-toi.";
}

if (!empty($livresContexte)) {
  $systemPrompt .= "\n\nCatalogue :\n";
  foreach ($livresContexte as $l) {
    $dispo = $l['available_copies'] > 0
      ? $l['available_copies'] . '/' . $l['total_copies'] . ' exemplaire(s) disponible(s)'
      : 'aucun exemplaire disponible actuellement';
    $categorie = $l['categorie'] ?? 'non classé';
    $systemPrompt .= "- \"{$l['title']}\" de {$l['author']} — categorie: {$categorie} — {$l['description']} ({$dispo})\n";
  }
} else {
  $systemPrompt .= "\n\nAucun livre du catalogue ne correspond a cette question. "
    . "Dis-le a l'utilisateur, ne propose aucun titre de ton propre chef.";
}

$historiqueRecent = array_slice($historique, -6); // 6 derniers messages max, pour limiter le contexte

// --- 4. Appel Groq (format OpenAI, un seul appelant pour les deux modèles) ---
function appellerGroq(string $modele, string $systemPrompt, array $historique, string $message): string
{
  $messages = [['role' => 'system', 'content' => $systemPrompt]];
  foreach ($historique as $h) {
    if (isset($h['role'], $h['content'])) {
      $messages[] = ['role' => $h['role'], 'content' => (string)$h['content']];
    }
  }
  $messages[] = ['role' => 'user', 'content' => $message];

  $payload = json_encode([
    'model' => $modele,
    'messages' => $messages,
    'temperature' => 0.3,
    'max_tokens' => 200,
    'stream' => false,
  ]);

  $ch = curl_init(GROQ_URL);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
      'Content-Type: application/json',
      'Authorization: Bearer ' . GROQ_API_KEY,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
  ]);
  $result = curl_exec($ch);
  $curlError = curl_error($ch);
  curl_close($ch);

  if ($result === false) {
    json_error('Assistant IA momentanément indisponible (' . $curlError . ')', 503);
  }
  $data = json_decode($result, true);

  if (isset($data['error'])) {
    json_error('Erreur API Groq : ' . ($data['error']['message'] ?? 'inconnue'), 502);
  }

  $reponse = $data['choices'][0]['message']['content'] ?? null;
  if ($reponse === null) {
    json_error('Réponse invalide de Groq', 502);
  }
  return $reponse;
}

// --- 5. Exécution ---
$modele = $estRequeteStock ? GROQ_MODEL_RAPIDE : GROQ_MODEL_EXPERT;
$reponse = appellerGroq($modele, $systemPrompt, $historiqueRecent, $message);

json_response([
  'reponse' => $reponse,
  'modele_utilise' => $modele . ' (cloud)',
]);
