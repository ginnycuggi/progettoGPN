-- Crea il database
CREATE DATABASE IF NOT EXISTS scambio_schemi CHARACTER SET utf8 COLLATE utf8_general_ci;

USE scambio_schemi;

-- Tabella degli schemi caricati
CREATE TABLE IF NOT EXISTS schemi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  materia VARCHAR(100),
  argomento VARCHAR(255),
  anno_scolastico VARCHAR(100),
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valutazione INT DEFAULT 0,
  visualizzazioni INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Indici per migliorare le ricerche
CREATE INDEX idx_materia ON schemi(materia);
CREATE INDEX idx_argomento ON schemi(argomento);
CREATE INDEX idx_anno_scolastico ON schemi(anno_scolastico);
CREATE INDEX idx_upload_date ON schemi(upload_date);
