<?php
$ch = curl_init('http://127.0.0.1:11434/api/chat');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode([
    'model' => 'llama3.2:1b',
    'messages' => [['role' => 'user', 'content' => 'Bonjour']],
    'stream' => false,
  ]),
  CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 30,
]);
$result = curl_exec($ch);
echo "Erreur cURL : " . curl_error($ch) . "\n";
echo "Code cURL : " . curl_errno($ch) . "\n";
echo "Résultat : " . var_export($result, true);