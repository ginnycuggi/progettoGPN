<?php
require '../config/db.php';

if ($_FILES['file']) {
  $file = $_FILES['file'];
  $filename = time() . '-' . basename($file['name']);
  $target = '../uploads/' . $filename;

  if (move_uploaded_file($file['tmp_name'], $target)) {
    $stmt = $pdo->prepare("INSERT INTO schemi (filename, original_name) VALUES (?, ?)");
    $stmt->execute([$filename, $file['name']]);
    echo json_encode(['success' => true, 'name' => $file['name']]);
  } else {
    echo json_encode(['success' => false]);
  }
}
?>