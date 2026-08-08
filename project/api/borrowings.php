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

// GET: list all borrowings (with book + member joins)
if ($method === 'GET' && !$id) {
  $stmt = db()->query('
    SELECT bw.*,
      b.title AS book_title, b.author AS book_author, b.isbn AS book_isbn, b.cover_url AS book_cover_url,
      b.available_copies AS book_available_copies,
      c.color AS book_category_color,
      m.name AS member_name, m.prenom AS member_prenom, m.email AS member_email,
      m.phone AS member_phone, m.address AS member_address,
      m.parcours AS member_parcours, m.annee_etude AS member_annee_etude
    FROM borrowings bw
    JOIN books b ON bw.book_id = b.id
    LEFT JOIN categories c ON b.category_id = c.id
    JOIN members m ON bw.member_id = m.id
    ORDER BY bw.created_at DESC
  ');
  $borrowings = $stmt->fetchAll();

  $today = date('Y-m-d');
  foreach ($borrowings as &$bw) {
    if ($bw['return_date']) {
      $bw['status'] = 'returned';
    } elseif ($bw['due_date'] < $today) {
      $bw['status'] = 'overdue';
    } else {
      $bw['status'] = 'active';
    }
    $bw['books'] = [
      'id' => $bw['book_id'],
      'title' => $bw['book_title'],
      'author' => $bw['book_author'],
      'isbn' => $bw['book_isbn'],
      'cover_url' => $bw['book_cover_url'],
      'available_copies' => $bw['book_available_copies'],
      'categories' => $bw['book_category_color'] ? ['color' => $bw['book_category_color']] : null,
    ];
    $bw['members'] = [
      'id' => $bw['member_id'],
      'name' => $bw['member_name'],
      'prenom' => $bw['member_prenom'],
      'email' => $bw['member_email'],
      'phone' => $bw['member_phone'],
      'address' => $bw['member_address'],
      'parcours' => $bw['member_parcours'],
      'annee_etude' => $bw['member_annee_etude'],
    ];
    unset(
      $bw['book_title'], $bw['book_author'], $bw['book_cover_url'],
      $bw['book_isbn'],
      $bw['book_available_copies'], $bw['book_category_color'],
      $bw['member_name'], $bw['member_prenom'], $bw['member_email'],
      $bw['member_phone'], $bw['member_address'], $bw['member_parcours'], $bw['member_annee_etude']
    );
  }
  json_response($borrowings);
}

// POST: create borrowing(s) (admin only) - supports multiple book IDs in one request
if ($method === 'POST') {
  require_admin();
  $body = get_body();

  $bookIds = [];
  if (isset($body['book_ids']) && is_array($body['book_ids'])) {
    $bookIds = array_map('intval', $body['book_ids']);
  } elseif (isset($body['book_id'])) {
    $bookIds = [(int)$body['book_id']];
  }
  $bookIds = array_filter($bookIds, fn($v) => $v > 0);
  $memberId = (int)($body['member_id'] ?? 0);
  $borrowDate = $body['borrow_date'] ?? date('Y-m-d');
  $dueDate = $body['due_date'] ?? date('Y-m-d', strtotime('+14 days'));
  $notes = $body['notes'] ?? '';

  if (empty($bookIds) || !$memberId) json_error('Livre(s) et étudiant requis');

  // Limit rules
  $MAX_ACTIVE = 2;
  $activeStmt = db()->prepare('SELECT COUNT(*) FROM borrowings WHERE member_id = ? AND return_date IS NULL');
  $activeStmt->execute([$memberId]);
  $activeCount = (int)$activeStmt->fetchColumn();
  $requested = count($bookIds);
  if ($activeCount >= $MAX_ACTIVE) json_error('Cet étudiant a déjà le nombre maximum d\'emprunts actifs', 400);
  if ($activeCount + $requested > $MAX_ACTIVE) json_error('Demande dépasse la limite d\'emprunts actifs pour cet étudiant', 400);

  try {
    db()->beginTransaction();
    $created = [];
    foreach ($bookIds as $bookId) {
      $stmt = db()->prepare('SELECT available_copies FROM books WHERE id = ? FOR UPDATE');
      $stmt->execute([$bookId]);
      $book = $stmt->fetch();
      if (!$book || $book['available_copies'] < 1) {
        throw new Exception("Le livre id={$bookId} n'est pas disponible");
      }

      db()->prepare('INSERT INTO borrowings (book_id, member_id, borrow_date, due_date, status, notes) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$bookId, $memberId, $borrowDate, $dueDate, 'active', $notes]);

      db()->prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?')
        ->execute([$bookId]);

      $created[] = db()->lastInsertId();
    }
    db()->commit();
    json_response(['success' => true, 'ids' => $created]);
  } catch (Exception $e) {
    db()->rollBack();
    json_error('Erreur lors de la création des emprunts: ' . $e->getMessage(), 500);
  }
}

// PUT: return a borrowing (admin only)
if ($method === 'PUT' && $id) {
  require_admin();
  $body = get_body();

  $stmt = db()->prepare('SELECT * FROM borrowings WHERE id = ?');
  $stmt->execute([$id]);
  $borrowing = $stmt->fetch();
  if (!$borrowing) json_error('Emprunt introuvable', 404);

  if ($borrowing['return_date'] !== null || $borrowing['status'] === 'returned') {
    json_error('Cet emprunt a déjà été retourné', 400);
  }

  $returnDate = $body['return_date'] ?? date('Y-m-d');
  $notes = $body['notes'] ?? $borrowing['notes'];

  db()->prepare('UPDATE borrowings SET return_date = ?, status = ?, notes = ? WHERE id = ?')
    ->execute([$returnDate, 'returned', $notes, $id]);

  // Increment available_copies
  db()->prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?')
    ->execute([$borrowing['book_id']]);

  json_response(['success' => true]);
}

// DELETE: delete borrowing (admin only)
if ($method === 'DELETE' && $id) {
  require_admin();
  $stmt = db()->prepare('SELECT * FROM borrowings WHERE id = ?');
  $stmt->execute([$id]);
  $borrowing = $stmt->fetch();
  if (!$borrowing) json_error('Emprunt introuvable', 404);

  // If active, restore available_copies
  if (!$borrowing['return_date']) {
    db()->prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?')
      ->execute([$borrowing['book_id']]);
  }

  db()->prepare('DELETE FROM borrowings WHERE id = ?')->execute([$id]);
  json_response(['success' => true]);
}

json_error('Méthode non supportée', 405);
