<?php
require '../config/db.php';

if ($_FILES['file']) {
  $file = $_FILES['file'];
  $uploadsDir = '../uploads/';
  
  // Crea la cartella uploads se non esiste
  if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
  }
  
  $filename = time() . '-' . basename($file['name']);
  $target = $uploadsDir . $filename;

  if (move_uploaded_file($file['tmp_name'], $target)) {
    // Salva il file nel database per tenere traccia
    try {
      // Nota: materia, argomento e anno vengono opzionali per questa API
      // Se necessario vengono inviati dal frontend in POST
      $materia = isset($_POST['materia']) ? $_POST['materia'] : null;
      $argomento = isset($_POST['argomento']) ? $_POST['argomento'] : null;
      $anno = isset($_POST['anno']) ? $_POST['anno'] : null;
      
      $stmt = $pdo->prepare("INSERT INTO schemi (filename, original_name, materia, argomento, anno_scolastico) VALUES (?, ?, ?, ?, ?)");
      $stmt->execute([$filename, $file['name'], $materia, $argomento, $anno]);
      
      echo json_encode([
        'success' => true, 
        'name' => $file['name'], 
        'filename' => $filename,
        'id' => $pdo->lastInsertId()
      ]);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'error' => 'Errore database: ' . $e->getMessage()]);
    }
  } else {
    echo json_encode(['success' => false, 'error' => 'Errore durante il caricamento del file']);
  }
} else {
  echo json_encode(['success' => false, 'error' => 'Nessun file caricato']);
}
?>