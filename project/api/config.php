<?php
// Database configuration for XAMPP MySQL
define('DB_HOST', 'localhost');
define('DB_NAME', 'bibliotheque_ist');
define('DB_USER', 'root');
define('DB_PASS', '');

// CORS headers
header('Content-Type: application/json; charset=utf-8');

$allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Access-Control-Allow-Credentials: true');
} else {
  header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// Database connection
function db() {
  static $pdo = null;
  if ($pdo === null) {
    try {
      $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
          PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
          PDO::ATTR_EMULATE_PREPARES => false,
        ]
      );
    } catch (PDOException $e) {
      json_error('Database connection failed: ' . $e->getMessage(), 500);
    }
  }
  return $pdo;
}

// JSON response
function json_response($data, int $code = 200): void {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

// JSON error response
function json_error(string $message, int $code = 400): void {
  http_response_code($code);
  echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
  exit;
}

// Get JSON body
function get_body(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

// Get query params
function get_query(): array {
  return $_GET;
}

// Nullify empty strings for optional fields
function null_if_empty($val) {
  if ($val === '' || $val === null) return null;
  return $val;
}

// Start session
if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

// Check if user is authenticated
function is_authenticated(): ?array {
  if (isset($_SESSION['user_id'])) {
    return [
      'id' => $_SESSION['user_id'],
      'role' => $_SESSION['user_role'] ?? 'student',
      'name' => $_SESSION['user_name'] ?? '',
      'email' => $_SESSION['user_email'] ?? '',
    ];
  }
  return null;
}

// Require authentication
function require_auth(): array {
  $user = is_authenticated();
  if (!$user) json_error('Non authentifié', 401);
  return $user;
}

// Require admin
function require_admin(): array {
  $user = require_auth();
  if ($user['role'] !== 'admin') json_error('Accès administrateur requis', 403);
  return $user;
}
