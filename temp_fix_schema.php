<?php
$pdo = new PDO('mysql:host=localhost;dbname=gestor_calidad;charset=utf8mb4', 'root', '140226');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec("ALTER TABLE actividades_padre ADD COLUMN IF NOT EXISTS solicitado_por VARCHAR(150) NULL AFTER nombre_actividad");
$pdo->exec("ALTER TABLE actividades_padre MODIFY COLUMN responsable VARCHAR(150) NULL");
$stmt = $pdo->query('DESCRIBE actividades_padre');
$cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo implode(PHP_EOL, $cols) . PHP_EOL;
