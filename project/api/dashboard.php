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

// GET: dashboard stats + recent activity
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') json_error('Méthode non supportée', 405);

$today = date('Y-m-d');
$firstOfMonth = date('Y-m-01');

// Total books
$totalBooks = (int)db()->query('SELECT COUNT(*) FROM books')->fetchColumn();

// Available copies
$availableBooks = (int)db()->query('SELECT COALESCE(SUM(available_copies), 0) FROM books')->fetchColumn();

// Total members
$totalMembers = (int)db()->query('SELECT COUNT(*) FROM members')->fetchColumn();

// New members this month
$newMembersStmt = db()->prepare('SELECT COUNT(*) FROM members WHERE created_at >= ?');
$newMembersStmt->execute([$firstOfMonth . ' 00:00:00']);
$newMembers = (int)$newMembersStmt->fetchColumn();

// Active loans
$activeLoans = (int)db()->query("SELECT COUNT(*) FROM borrowings WHERE return_date IS NULL")->fetchColumn();

// Overdue loans
$overdueLoans = (int)db()->query("SELECT COUNT(*) FROM borrowings WHERE return_date IS NULL AND due_date < '$today'")->fetchColumn();

// Returned this month
$returnedThisMonthStmt = db()->prepare('SELECT COUNT(*) FROM borrowings WHERE return_date >= ?');
$returnedThisMonthStmt->execute([$firstOfMonth . ' 00:00:00']);
$returnedThisMonth = (int)$returnedThisMonthStmt->fetchColumn();

// Recent borrowings (8 latest)
$recentBorrowingsStmt = db()->query("
  SELECT bw.id, bw.book_id, bw.member_id, bw.borrow_date, bw.due_date, bw.return_date, bw.status, bw.notes,
    b.title AS book_title, b.author AS book_author, b.isbn AS book_isbn, b.cover_url AS book_cover_url,
    m.name AS member_name, m.prenom AS member_prenom, m.email AS member_email,
    m.phone AS member_phone, m.address AS member_address, m.parcours AS member_parcours, m.annee_etude AS member_annee_etude
  FROM borrowings bw
  JOIN books b ON bw.book_id = b.id
  JOIN members m ON bw.member_id = m.id
  ORDER BY bw.created_at DESC
  LIMIT 8
");
$recentBorrowings = $recentBorrowingsStmt->fetchAll();
foreach ($recentBorrowings as &$b) {
  if ($b['return_date']) $b['status'] = 'returned';
  elseif ($b['due_date'] < $today) $b['status'] = 'overdue';
  else $b['status'] = 'active';
  $b['books'] = [
    'title' => $b['book_title'],
    'author' => $b['book_author'],
    'isbn' => $b['book_isbn'],
    'cover_url' => $b['book_cover_url'],
  ];
  $b['members'] = [
    'name' => $b['member_name'],
    'prenom' => $b['member_prenom'],
    'email' => $b['member_email'],
    'phone' => $b['member_phone'],
    'address' => $b['member_address'],
    'parcours' => $b['member_parcours'],
    'annee_etude' => $b['member_annee_etude'],
  ];
  unset($b['book_title'], $b['book_author'], $b['book_isbn'], $b['book_cover_url'], $b['member_name'], $b['member_prenom'], $b['member_email'], $b['member_phone'], $b['member_address'], $b['member_parcours'], $b['member_annee_etude']);
}

// Recent books (5 latest)
$recentBooksStmt = db()->query("
  SELECT b.*, c.name AS category_name, c.color AS category_color
  FROM books b
  LEFT JOIN categories c ON b.category_id = c.id
  ORDER BY b.created_at DESC
  LIMIT 5
");
$recentBooks = $recentBooksStmt->fetchAll();
foreach ($recentBooks as &$book) {
  $book['categories'] = $book['category_name'] ? [
    'name' => $book['category_name'],
    'color' => $book['category_color'],
  ] : null;
  unset($book['category_name'], $book['category_color']);
}

json_response([
  'totalBooks' => $totalBooks,
  'totalMembers' => $totalMembers,
  'activeLoans' => $activeLoans,
  'overdueLoans' => $overdueLoans,
  'availableBooks' => $availableBooks,
  'newMembersThisMonth' => $newMembers,
  'returnedThisMonth' => $returnedThisMonth,
  'recentBorrowings' => $recentBorrowings,
  'recentBooks' => $recentBooks,
]);
