<?php

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($method !== 'POST') {
    json_error('Méthode non supportée', 405);
}

if (empty($_FILES['cover']) || $_FILES['cover']['error'] !== UPLOAD_ERR_OK) {
    json_error('Aucune image de couverture reçue', 400);
}

$file = $_FILES['cover'];
$allowedMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$imageInfo = getimagesize($file['tmp_name']);
if (!$imageInfo || !in_array($imageInfo['mime'], $allowedMime, true)) {
    json_error('Format d\'image non supporté. Utilisez JPG, PNG, GIF ou WebP.', 400);
}

$ext = image_type_to_extension($imageInfo[2], false);
if (!$ext) {
    json_error('Impossible de déterminer l\'extension du fichier.', 400);
}

$uploadDir = __DIR__ . '/uploads/covers';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        json_error('Impossible de créer le dossier de destination.', 500);
    }
}

$safeName = 'cover_' . bin2hex(random_bytes(8)) . '.' . $ext;
$destination = $uploadDir . '/' . $safeName;
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    json_error('Échec de l\'enregistrement de l\'image.', 500);
}

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$baseDir = dirname($_SERVER['SCRIPT_NAME']);
$coverUrl = sprintf('%s://%s%s/uploads/covers/%s', $protocol, $host, $baseDir, $safeName);

json_response(['success' => true, 'cover_url' => $coverUrl]);
