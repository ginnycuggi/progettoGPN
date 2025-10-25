<?php
$host = 'localhost';
$dbname = 'scambio_schemi';
$user = 'root';
$pass = '';

try {
  $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
} catch (PDOException $e) {
  die("Errore connessione: " . $e->getMessage());
}
?>