<?php

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

// GET: list all books (with category join)
if ($method === 'GET' && !$id) {
  $stmt = db()->query('
    SELECT b.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    ORDER BY b.title
  ');
  $books = $stmt->fetchAll();
  foreach ($books as &$b) {
    $b['categories'] = $b['category_id'] ? [
      'id' => $b['category_id'],
      'name' => $b['category_name'],
      'color' => $b['category_color'],
      'icon' => $b['category_icon'],
    ] : null;
    unset($b['category_name'], $b['category_color'], $b['category_icon']);
  }
  json_response($books);
}

// GET: single book
if ($method === 'GET' && $id) {
  $stmt = db()->prepare('
    SELECT b.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = ?
  ');
  $stmt->execute([$id]);
  $book = $stmt->fetch();
  if (!$book) json_error('Livre introuvable', 404);
  $book['categories'] = $book['category_id'] ? [
    'id' => $book['category_id'],
    'name' => $book['category_name'],
    'color' => $book['category_color'],
    'icon' => $book['category_icon'],
  ] : null;
  unset($book['category_name'], $book['category_color'], $book['category_icon']);
  json_response($book);
}

// POST: create book (admin only)
if ($method === 'POST') {
  require_admin();
  $body = get_body();

  $title = trim($body['title'] ?? '');
  $author = trim($body['author'] ?? '');
  if ($title === '' || $author === '') json_error('Le titre et l\'auteur sont requis');

  $total = (int)($body['total_copies'] ?? 1);
  $available = $total;

  db()->prepare('
    INSERT INTO books (title, author, isbn, category_id, description, cover_url, total_copies, available_copies, published_year, language, pages, publisher)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ')->execute([
    $title,
    $author,
    null_if_empty($body['isbn'] ?? null),
    null_if_empty($body['category_id'] ?? null),
    $body['description'] ?? '',
    $body['cover_url'] ?? '',
    $total,
    $available,
    null_if_empty($body['published_year'] ?? null),
    $body['language'] ?? 'Français',
    null_if_empty($body['pages'] ?? null),
    $body['publisher'] ?? '',
  ]);

  json_response(['success' => true, 'id' => db()->lastInsertId()]);
}

// PUT: update book (admin only)
if ($method === 'PUT' && $id) {
  require_admin();
  $body = get_body();

  $stmt = db()->prepare('SELECT * FROM books WHERE id = ?');
  $stmt->execute([$id]);
  $existing = $stmt->fetch();
  if (!$existing) json_error('Livre introuvable', 404);

  $total = (int)($body['total_copies'] ?? $existing['total_copies']);
  // Recalculate available: existing_available + (new_total - old_total)
  $available = (int)$existing['available_copies'] + ($total - (int)$existing['total_copies']);
  if ($available < 0) $available = 0;

  db()->prepare('
    UPDATE books SET
      title = ?, author = ?, isbn = ?, category_id = ?, description = ?,
      cover_url = ?, total_copies = ?, available_copies = ?,
      published_year = ?, language = ?, pages = ?, publisher = ?
    WHERE id = ?
  ')->execute([
    trim($body['title'] ?? $existing['title']),
    trim($body['author'] ?? $existing['author']),
    null_if_empty($body['isbn'] ?? null),
    null_if_empty($body['category_id'] ?? null),
    $body['description'] ?? $existing['description'],
    $body['cover_url'] ?? $existing['cover_url'],
    $total,
    $available,
    null_if_empty($body['published_year'] ?? null),
    $body['language'] ?? $existing['language'],
    null_if_empty($body['pages'] ?? null),
    $body['publisher'] ?? $existing['publisher'],
    $id,
  ]);

  json_response(['success' => true]);
}

// DELETE: delete book (admin only)
if ($method === 'DELETE' && $id) {
  require_admin();
  db()->prepare('DELETE FROM books WHERE id = ?')->execute([$id]);
  json_response(['success' => true]);
}

json_error('Méthode non supportée', 405);
