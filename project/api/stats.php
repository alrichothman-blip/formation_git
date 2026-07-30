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

// GET: statistics for the stats page
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') json_error('Méthode non supportée', 405);

$today = date('Y-m-d');

// Books with category info
$booksStmt = db()->query("
  SELECT b.id, b.title, b.total_copies, b.available_copies, b.category_id,
    c.name AS category_name, c.color AS category_color
  FROM books b
  LEFT JOIN categories c ON b.category_id = c.id
");
$books = $booksStmt->fetchAll();

// Members
$membersStmt = db()->query("SELECT id, status, created_at FROM members");
$members = $membersStmt->fetchAll();

// Borrowings with book title
$borrowingsStmt = db()->query("
  SELECT bw.id, bw.book_id, bw.member_id, bw.borrow_date, bw.return_date, bw.due_date, bw.status,
    b.title AS book_title
  FROM borrowings bw
  JOIN books b ON bw.book_id = b.id
");
$borrowings = $borrowingsStmt->fetchAll();

// Books by category
$catCounts = [];
foreach ($books as $b) {
  $catId = $b['category_id'] ?? 'none';
  $catName = $b['category_name'] ?? 'Sans catégorie';
  $catColor = $b['category_color'] ?? '#94a3b8';
  if (!isset($catCounts[$catId])) {
    $catCounts[$catId] = ['name' => $catName, 'color' => $catColor, 'count' => 0, 'available' => 0];
  }
  $catCounts[$catId]['count'] += (int)$b['total_copies'];
  $catCounts[$catId]['available'] += (int)$b['available_copies'];
}
$booksByCategory = array_values($catCounts);
usort($booksByCategory, fn($a, $b) => $b['count'] <=> $a['count']);

// Most borrowed books
$bookBorrowCounts = [];
foreach ($borrowings as $b) {
  $bid = $b['book_id'];
  if (!isset($bookBorrowCounts[$bid])) {
    $bookBorrowCounts[$bid] = ['title' => $b['book_title'] ?? 'Inconnu', 'count' => 0];
  }
  $bookBorrowCounts[$bid]['count']++;
}
$topBooks = array_values($bookBorrowCounts);
usort($topBooks, fn($a, $b) => $b['count'] <=> $a['count']);
$topBooks = array_slice($topBooks, 0, 5);

// Monthly borrowings (last 6 months)
$monthlyData = [];
$now = new DateTime();
for ($i = 5; $i >= 0; $i--) {
  $d = (new DateTime())->modify('first day of this month')->modify("-$i months");
  $key = $d->format('Y-m');
  $monthlyData[$key] = 0;
}
foreach ($borrowings as $b) {
  $key = substr($b['borrow_date'], 0, 7);
  if (isset($monthlyData[$key])) $monthlyData[$key]++;
}
$monthly = [];
foreach ($monthlyData as $month => $count) {
  [$y, $m] = explode('-', $month);
  $label = date('M', mktime(0, 0, 0, (int)$m, 1, (int)$y));
  $monthly[] = ['month' => $label, 'count' => $count];
}

$activeMembers = count(array_filter($members, fn($m) => $m['status'] === 'active'));
$overdueLoans = count(array_filter($borrowings, fn($b) => !$b['return_date'] && $b['due_date'] < $today));
$returnedCount = count(array_filter($borrowings, fn($b) => $b['return_date']));
$returnRate = count($borrowings) > 0 ? (int)round($returnedCount / count($borrowings) * 100) : 0;

json_response([
  'booksByCategory' => $booksByCategory,
  'topBooks' => $topBooks,
  'monthly' => $monthly,
  'totalBooks' => count($books),
  'activeMembers' => $activeMembers,
  'totalMembers' => count($members),
  'overdueLoans' => $overdueLoans,
  'returnRate' => $returnRate,
  'totalBorrowings' => count($borrowings),
]);
