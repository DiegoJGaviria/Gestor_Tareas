<?php
// Configuración de cabeceras para API REST JSON y CORS
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 1. Configuración del servidor y base de datos
$host = 'localhost';
$db   = 'gestor_calidad';
$user = 'root';
$pass = '140226'; 

// 2. Iniciar sesión de forma segura
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 3. Establecer la Conexión PDO
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (\PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Error de conexión: ' . $e->getMessage()]);
    exit;
}

function asegurarColumnaSolicitadoPor(PDO $pdo): void {
    $stmt = $pdo->query("SELECT COUNT(*) AS existe FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'actividades_padre' AND COLUMN_NAME = 'solicitado_por'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || (int) $row['existe'] === 0) {
        $pdo->exec("ALTER TABLE actividades_padre ADD COLUMN solicitado_por VARCHAR(150) NULL AFTER nombre_actividad");
    }
}

function verificarPassword(string $passwordIngresada, string $passwordGuardado): bool {
    if ($passwordGuardado === '') {
        return false;
    }

    if (password_verify($passwordIngresada, $passwordGuardado)) {
        return true;
    }

    return hash_equals($passwordGuardado, $passwordIngresada);
}

asegurarColumnaSolicitadoPor($pdo);

// 4. Capturar la acción enviada desde el Frontend
$action = $_GET['action'] ?? '';

// ==========================================
// ENDPOINTS DE AUTENTICACIÓN Y USUARIOS
// ==========================================

// CORRECCIÓN 1: Consulta arreglada (Sin WHERE) uniendo la tabla de Rol
if ($action === 'get_todos_usuarios') {
    $stmt = $pdo->query("SELECT nombre_completo, COALESCE(rol, 'Sin rol') AS rol FROM usuarios ORDER BY nombre_completo ASC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

elseif ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $nombre = trim($data['nombre'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($nombre) || empty($password)) {
        echo json_encode(['success' => false, 'error' => 'Complete todos los campos']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id_usuario, nombre_completo, correo, rol, password FROM usuarios WHERE nombre_completo = ?");
    $stmt->execute([$nombre]);
    $user = $stmt->fetch();

    if ($user && verificarPassword($password, $user['password'])) {
        if (password_get_info($user['password'])['algo'] === 'bcrypt' || password_get_info($user['password'])['algo'] === '2y') {
            // Mantener compatibilidad con el login actual sin romper usuarios ya hasheados.
        }

        $_SESSION['user_id'] = $user['id_usuario'];
        $_SESSION['user_nombre'] = $user['nombre_completo'];
        $_SESSION['user_rol'] = $user['rol']; 
        
        echo json_encode(['success' => true, 'message' => 'Autenticación exitosa']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Contraseña incorrecta o usuario no válido']);
    }
    exit;
}

elseif ($action === 'verificar_sesion') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            'logged' => true, 
            'usuario' => $_SESSION['user_nombre'], 
            'rol' => $_SESSION['user_rol'] ?? ''
        ]);
    } else {
        echo json_encode(['logged' => false]);
    }
    exit;
}

elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
    exit;
}

elseif ($action === 'get_solicitantes') {
   $stmt = $pdo->query("SELECT nombre_completo AS nombre FROM Solicitantes ORDER BY nombre_completo ASC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

elseif ($action === 'get_responsables') {
    $stmt = $pdo->query("SELECT nombre_completo AS nombre FROM usuarios WHERE nombre_completo IS NOT NULL AND nombre_completo <> '' ORDER BY nombre_completo ASC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

// ==========================================
// ENDPOINTS DE CATÁLOGOS Y GESTIÓN
// ==========================================

elseif ($action === 'get_macroprocesos') {
    $stmt = $pdo->query("SELECT id_macro, nombre_macro FROM macroproceso ORDER BY nombre_macro ASC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
} 

elseif ($action === 'get_procesos') {
    $macro_id = $_GET['macro_id'] ?? '';
    $stmt = $pdo->prepare("SELECT id_proceso, nombre_proceso FROM procesos WHERE id_macro_fk = ? ORDER BY nombre_proceso ASC");
    $stmt->execute([$macro_id]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

elseif ($action === 'get_actividades') {
    try {
        $sql = "SELECT 
                    a.id_actividad, 
                    a.nombre_actividad, 
                    a.solicitado_por, 
                    a.responsable, 
                    a.creado_por,
                    p.nombre_proceso,
                    m.nombre_macro,
                    COALESCE(AVG(s.valor_avance), 0) * 100 AS porcentaje_total
                FROM actividades_padre a
                LEFT JOIN procesos p ON a.proceso_ref = p.id_proceso
                LEFT JOIN macroproceso m ON p.id_macro_fk = m.id_macro
                LEFT JOIN sub_actividades_hija s ON a.id_actividad = s.actividad_ref
                GROUP BY a.id_actividad
                ORDER BY a.id_actividad DESC";
        $stmt = $pdo->query($sql);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

elseif ($action === 'get_subactividades') {
    $id_actividad = $_GET['id_actividad'] ?? '';
    if (empty($id_actividad)) {
        echo json_encode(['success' => false, 'error' => 'ID de actividad requerido']);
        exit;
    }
    $stmt = $pdo->prepare("SELECT id_sub, nombre_sub, estado_sub, valor_avance, responsable_sub FROM sub_actividades_hija WHERE actividad_ref = ?");
    $stmt->execute([$id_actividad]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

elseif ($action === 'guardar_actividad' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $nombre_actividad = trim($data['nombre_actividad'] ?? '');
    $solicitado_por = trim($data['solicitado_por'] ?? '');
    $responsable = trim($data['responsable'] ?? '');
    $proceso_ref = $data['proceso_ref'] ?? '';
    $subactividades = $data['subactividades'] ?? [];

    if (empty($nombre_actividad) || empty($solicitado_por) || empty($responsable) || empty($proceso_ref) || empty($subactividades)) {
        echo json_encode(['success' => false, 'error' => 'Faltan datos obligatorios']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $usuarioCreador = $_SESSION['user_nombre'] ?? 'Sistema';
        $solicitadoPorValor = $solicitado_por ?: $usuarioCreador;

        $stmtPadre = $pdo->prepare("INSERT INTO actividades_padre 
            (nombre_actividad, solicitado_por, responsable, proceso_ref, creado_por, modificado_por) 
            VALUES (?, ?, ?, ?, ?, ?)");
        
        $stmtPadre->execute([$nombre_actividad, $solicitadoPorValor, $responsable, $proceso_ref, $usuarioCreador, $usuarioCreador]);
        $idActividadPadre = $pdo->lastInsertId();

        $stmtHija = $pdo->prepare("INSERT INTO sub_actividades_hija (actividad_ref, nombre_sub, estado_sub, responsable_sub) VALUES (?, ?, ?, ?)");
        
        foreach ($subactividades as $sub) {
            $nombreSub = trim($sub['nombre_sub'] ?? '');
            if (!empty($nombreSub)) {
                $estadoSub = $sub['estado_sub'] ?? 'Pendiente';
                $responsableSub = trim($sub['responsable_sub'] ?? $responsable);
                
                $stmtHija->execute([$idActividadPadre, $nombreSub, $estadoSub, $responsableSub]);
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Actividad guardada correctamente', 'id_actividad' => $idActividadPadre]);

    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// ==========================================
// ENDPOINTS DE REPORTES Y FILTROS AVANZADOS
// ==========================================

elseif ($action === 'get_reportes') {
    try {
        $macro_id = $_GET['macro_id'] ?? '';
        $proceso_id = $_GET['proceso_id'] ?? '';
        $responsable = $_GET['responsable'] ?? '';
        $creado_por = $_GET['creado_por'] ?? '';

        $sql = "SELECT 
                    a.id_actividad,
                    a.nombre_actividad,
                    a.solicitado_por,
                    a.responsable,
                    a.creado_por,
                    p.id_proceso,
                    p.nombre_proceso,
                    m.id_macro,
                    m.nombre_macro,
                    COALESCE(AVG(s.valor_avance), 0) * 100 AS porcentaje_total,
                    COUNT(s.id_sub) as total_subactividades
                FROM actividades_padre a
                JOIN procesos p ON a.proceso_ref = p.id_proceso
                JOIN macroproceso m ON p.id_macro_fk = m.id_macro
                LEFT JOIN sub_actividades_hija s ON a.id_actividad = s.actividad_ref
                WHERE 1=1";

        $params = [];

        if (!empty($macro_id)) {
            $sql .= " AND m.id_macro = ?";
            $params[] = $macro_id;
        }
        if (!empty($proceso_id)) {
            $sql .= " AND p.id_proceso = ?";
            $params[] = $proceso_id;
        }
        if (!empty($responsable)) {
            $sql .= " AND (a.responsable = ? OR s.responsable_sub = ?)";
            $params[] = $responsable;
            $params[] = $responsable;
        }
        if (!empty($creado_por)) {
            $sql .= " AND a.creado_por = ?";
            $params[] = $creado_por;
        }

        $sql .= " GROUP BY a.id_actividad ORDER BY porcentaje_total DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reportes = $stmt->fetchAll();

        $sqlStats = "SELECT 
                        COUNT(DISTINCT a.id_actividad) as total_actividades,
                        COALESCE(AVG(sub_avg.avance_actividad), 0) * 100 as promedio_avance_general
                     FROM actividades_padre a
                     LEFT JOIN (
                         SELECT actividad_ref, AVG(valor_avance) as avance_actividad 
                         FROM sub_actividades_hija 
                         GROUP BY actividad_ref
                     ) sub_avg ON a.id_actividad = sub_avg.actividad_ref";
        $stmtStats = $pdo->query($sqlStats);
        $stats = $stmtStats->fetch();

        echo json_encode([
            'success' => true, 
            'data' => $reportes,
            'estadisticas' => [
                'total_actividades' => intval($stats['total_actividades']),
                'promedio_general' => round(floatval($stats['promedio_general']), 2)
            ]
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

else {
    echo json_encode(['success' => false, 'error' => 'Acción no válida o endpoint no encontrado']);
    exit;
}
?>