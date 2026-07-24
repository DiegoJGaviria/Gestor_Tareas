<?php
$pdo = new PDO('mysql:host=localhost;dbname=gestor_calidad;charset=utf8mb4', 'root', '140226');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$stmt = $pdo->query('SHOW COLUMNS FROM sub_actividades_hija');
$cols = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $cols[] = $row['Field'];
}
if (!in_array('responsable_sub', $cols, true)) {
    $pdo->exec('ALTER TABLE sub_actividades_hija ADD COLUMN responsable_sub VARCHAR(150) NULL');
}
echo "ok\n";
