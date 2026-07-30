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

// GET: list all categories
if ($method === 'GET' && !$id) {
  $stmt = db()->query('SELECT * FROM categories ORDER BY name');
  json_response($stmt->fetchAll());
}

// POST: create category (admin only)
if ($method === 'POST') {
  require_admin();
  $body = get_body();
  $name = trim($body['name'] ?? '');
  if ($name === '') json_error('Le nom est requis');

  db()->prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)')
    ->execute([$name, $body['color'] ?? '#3B82F6', $body['icon'] ?? 'BookOpen']);
  json_response(['success' => true, 'id' => db()->lastInsertId()]);
}

// PUT: update category (admin only)
if ($method === 'PUT' && $id) {
  require_admin();
  $body = get_body();
  db()->prepare('UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?')
    ->execute([
      trim($body['name'] ?? ''),
      $body['color'] ?? '#3B82F6',
      $body['icon'] ?? 'BookOpen',
      $id,
    ]);
  json_response(['success' => true]);
}

// DELETE: delete category (admin only)
if ($method === 'DELETE' && $id) {
  require_admin();
  db()->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
  json_response(['success' => true]);
}

json_error('Méthode non supportée', 405);
