<?php
require '../config/db.php';

$query = $_GET['q'] ?? '';
$stmt = $pdo->prepare("SELECT * FROM schemi WHERE original_name LIKE ?");
$stmt->execute(['%' . $query . '%']);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($results);
?>