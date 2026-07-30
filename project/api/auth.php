<?php

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'register' && $method === 'POST') {
  $body = get_body();

  $name = trim($body['name'] ?? '');
  $prenom = trim($body['prenom'] ?? '');
  $email = trim($body['email'] ?? '');
  $password = $body['password'] ?? '';
  $parcours = $body['parcours'] ?? '';

  if ($name === '' || $email === '' || strlen($password) < 6) {
    json_error('Champs obligatoires manquants ou mot de passe trop court (min 6 caractères)');
  }

  // Check if email already exists
  $stmt = db()->prepare('SELECT id FROM members WHERE email = ?');
  $stmt->execute([$email]);
  if ($stmt->fetch()) {
    json_error('Cet e-mail est déjà inscrit. Connectez-vous.', 409);
  }

  $hashed = password_hash($password, PASSWORD_DEFAULT);

  $fields = [
    'name', 'prenom', 'email', 'password', 'phone', 'telephone2', 'address',
    'sexe', 'date_naissance', 'lieu_naissance', 'nationalite',
    'cin_numero', 'cin_date', 'cin_lieu',
    'parcours', 'annee_etude', 'annee_universitaire', 'statut_etudiant',
    'bacc_serie', 'bacc_mention', 'bacc_lieu', 'bacc_annee',
    'dernier_diplome', 'diplome_mention', 'diplome_lieu', 'diplome_annee',
    'type_formation', 'diplome_parcours', 'photo_url',
    'pere_nom', 'pere_profession', 'mere_nom', 'mere_profession',
    'parent_adresse', 'parent_contact',
    'contact_urgence_nom', 'contact_urgence_tel',
    'groupe_sanguin', 'renseignements_complementaires',
    'receipt_no', 'receipt_date', 'receipt_amount', 'receipt_url',
  ];

  $data = [];
  foreach ($fields as $f) {
    $val = $body[$f] ?? '';
    if (in_array($f, ['date_naissance', 'cin_date', 'receipt_date']) && $val === '') {
      $val = null;
    }
    if (in_array($f, ['bacc_annee', 'diplome_annee']) && $val === '') {
      $val = null;
    }
    if ($f === 'receipt_amount' && $val === '') {
      $val = 0;
    }
    $data[$f] = $val;
  }
  $data['password'] = $hashed;
  $data['role'] = 'student';
  $data['status'] = 'active';
  $data['membership_date'] = date('Y-m-d');
  $data['membership_expiry'] = date('Y-m-d', strtotime('+1 year'));

  $columns = array_keys($data);
  $placeholders = array_map(fn($c) => ":$c", $columns);
  $sql = 'INSERT INTO members (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
  $stmt = db()->prepare($sql);
  $stmt->execute($data);

  json_response(['success' => true, 'message' => 'Inscription réussie']);
}

if ($action === 'login' && $method === 'POST') {
  $body = get_body();
  $email = trim($body['email'] ?? '');
  $password = $body['password'] ?? '';

  if ($email === '' || $password === '') {
    json_error('E-mail et mot de passe requis');
  }

  $stmt = db()->prepare('SELECT id, name, prenom, email, password, role FROM members WHERE email = ?');
  $stmt->execute([$email]);
  $member = $stmt->fetch();

  if (!$member || !password_verify($password, $member['password'])) {
    json_error('E-mail ou mot de passe incorrect', 401);
  }

  $_SESSION['user_id'] = $member['id'];
  $_SESSION['user_role'] = $member['role'];
  $_SESSION['user_name'] = $member['name'] . ' ' . $member['prenom'];
  $_SESSION['user_email'] = $member['email'];

  json_response([
    'success' => true,
    'user' => [
      'id' => $member['id'],
      'name' => $member['name'],
      'prenom' => $member['prenom'],
      'email' => $member['email'],
      'role' => $member['role'],
    ],
  ]);
}

if ($action === 'logout' && $method === 'POST') {
  session_destroy();
  json_response(['success' => true]);
}

if ($action === 'me' && $method === 'GET') {
  $user = is_authenticated();
  if (!$user) json_error('Non authentifié', 401);
  json_response(['user' => $user]);
}

json_error('Action non reconnue', 404);
