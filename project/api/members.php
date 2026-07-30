<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

// GET: list all members (without password)
if ($method === 'GET' && !$id) {
  $stmt = db()->query('
    SELECT m.*,
      (SELECT COUNT(*) FROM borrowings b WHERE b.member_id = m.id AND b.return_date IS NULL) AS active_loans
    FROM members m
    ORDER BY m.name
  ');
  $members = $stmt->fetchAll();
  foreach ($members as &$m) {
    unset($m['password']);
  }
  json_response($members);
}

// GET: single member
if ($method === 'GET' && $id) {
  $stmt = db()->prepare('SELECT * FROM members WHERE id = ?');
  $stmt->execute([$id]);
  $member = $stmt->fetch();
  if (!$member) json_error('Étudiant introuvable', 404);
  unset($member['password']);
  json_response($member);
}

// PUT: update member (admin only)
if ($method === 'PUT' && $id) {
  require_admin();
  $body = get_body();

  $fields = [
    'name', 'prenom', 'email', 'phone', 'telephone2', 'address',
    'parcours', 'annee_etude', 'annee_universitaire', 'statut_etudiant',
    'sexe', 'nationalite', 'date_naissance', 'lieu_naissance',
    'cin_numero', 'cin_date', 'cin_lieu',
    'bacc_serie', 'bacc_mention', 'bacc_lieu', 'bacc_annee',
    'dernier_diplome', 'diplome_mention', 'diplome_lieu', 'diplome_annee',
    'type_formation', 'diplome_parcours', 'photo_url',
    'pere_nom', 'pere_profession', 'mere_nom', 'mere_profession',
    'parent_adresse', 'parent_contact',
    'contact_urgence_nom', 'contact_urgence_tel',
    'groupe_sanguin', 'renseignements_complementaires',
    'receipt_no', 'receipt_date', 'receipt_amount', 'receipt_url',
    'membership_date', 'membership_expiry', 'status', 'notes',
  ];

  $updates = [];
  $values = [];
  foreach ($fields as $f) {
    if (array_key_exists($f, $body)) {
      $val = $body[$f];
      if (in_array($f, ['date_naissance', 'cin_date', 'receipt_date']) && $val === '') {
        $val = null;
      }
      if (in_array($f, ['bacc_annee', 'diplome_annee']) && $val === '') {
        $val = null;
      }
      $updates[] = "$f = ?";
      $values[] = $val;
    }
  }

  if (empty($updates)) json_error('Aucune donnée à mettre à jour');

  $values[] = $id;
  $sql = 'UPDATE members SET ' . implode(', ', $updates) . ' WHERE id = ?';
  db()->prepare($sql)->execute($values);

  json_response(['success' => true]);
}

// DELETE: delete member (admin only)
if ($method === 'DELETE' && $id) {
  require_admin();
  try {
    db()->prepare('DELETE FROM members WHERE id = ?')->execute([$id]);
    json_response(['success' => true]);
  } catch (PDOException $e) {
    json_error('Impossible de supprimer (emprunts actifs?)', 409);
  }
}

json_error('Méthode non supportée', 405);
