-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS gestor_calidad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gestor_calidad;

-- 1. Tabla Macroproceso
CREATE TABLE IF NOT EXISTS macroproceso (
    id_macro VARCHAR(5) PRIMARY KEY,
    nombre_macro VARCHAR(150) NOT NULL
);

-- 2. Tabla Procesos
CREATE TABLE IF NOT EXISTS procesos (
    id_proceso VARCHAR(5) PRIMARY KEY,
    nombre_proceso VARCHAR(150) NOT NULL,
    id_macro_fk VARCHAR(5),
    FOREIGN KEY (id_macro_fk) REFERENCES macroproceso(id_macro) ON DELETE CASCADE
);

-- 3. Tabla Roles del Sistema
CREATE TABLE IF NOT EXISTS Rol (
    id_rol INT PRIMARY KEY,
    nombre_rol VARCHAR(100) NOT NULL
);

-- 4. Tabla Usuarios (Para el Login y control de acceso)
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(100) DEFAULT 'sin-correo@empresa.com',
    id_rol_fk INT NOT NULL,
    password VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_rol_fk) REFERENCES Rol(id_rol) ON DELETE CASCADE
);

-- 5. Tabla Solicitantes (Para la lista desplegable del formulario)
CREATE TABLE IF NOT EXISTS Solicitantes (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL
);

-- 6. Tabla Responsables (Para la lista desplegable del formulario)
CREATE TABLE IF NOT EXISTS Responsable (
    id_responsable INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE
);

-- 7. Tabla Padre (Macroactividades)
CREATE TABLE IF NOT EXISTS actividades_padre (
    id_actividad INT AUTO_INCREMENT PRIMARY KEY,
    nombre_actividad VARCHAR(200) NOT NULL,
    solicitado_por VARCHAR(150) NULL,
    responsable VARCHAR(150) NOT NULL,
    proceso_ref VARCHAR(5) NOT NULL,
    estado ENUM('Pendiente', 'En Proceso', 'Finalizado') DEFAULT 'Pendiente',
    priorizacion ENUM('Alta', 'Media', 'Baja') DEFAULT 'Media',
    resultado ENUM('Aprobado', 'No Aprobado', 'No Aplica') DEFAULT 'No Aplica',
    Software ENUM('Si', 'No') DEFAULT 'No',
    fecha_inicio DATE DEFAULT (CURRENT_DATE),
    fecha_fin DATE,
    -- Columnas de Auditoría
    creado_por VARCHAR(100) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    modificado_por VARCHAR(100) NOT NULL,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proceso_ref) REFERENCES procesos(id_proceso) ON DELETE CASCADE
);

-- 8. Tabla Sub_Actividades_Hija
CREATE TABLE IF NOT EXISTS sub_actividades_hija (
    id_sub INT AUTO_INCREMENT PRIMARY KEY,
    actividad_ref INT NOT NULL,
    nombre_sub VARCHAR(200) NOT NULL,
    responsable_sub VARCHAR(150) DEFAULT 'Sin Asignar',
    estado_sub ENUM('Pendiente', 'Hecho') DEFAULT 'Pendiente',
    valor_avance DECIMAL(3,2) GENERATED ALWAYS AS (IF(estado_sub = 'Hecho', 1.00, 0.00)) STORED,
    FOREIGN KEY (actividad_ref) REFERENCES actividades_padre(id_actividad) ON DELETE CASCADE
);

-- ==========================================
-- INSERCIÓN DE DATOS INICIALES (SEEDS)
-- ==========================================

INSERT INTO Rol (id_rol, nombre_rol) VALUES
(1, 'Admin'),
(2, 'Analista'),
(3, 'Auxiliar'),
(4, 'Coordinador');

INSERT INTO macroproceso (id_macro, nombre_macro) VALUES 
('GG', 'Gestión Gerencial'),
('GQ', 'Gestión de Calidad'),
('GL_2', 'Gestión Logística'),
('EF', 'Dispensación'),
('GV', 'Gestión Comercial Y Mercadeo'),
('GF', 'Gestión Financiera y Administrativa'),
('CM', 'Gestion de Cuentas Medicas'),
('TH_2', 'Gestión del Talento Humano'),
('TI', 'Gestión de Tecnología e Información'),
('IN', 'Inteligencia de Negocios'),
('CI', 'Control Interno');

INSERT INTO procesos (id_proceso, nombre_proceso, id_macro_fk) VALUES 
('AG', 'Asistente de Gerencia', 'GG'),
('RF', 'Revisoría Fiscal', 'GG'),
('AJ', 'Asesoría Jurídica', 'GG'),
('SI', 'SIAU', 'GG'),
('CO', 'Comunicaciones', 'GG'),
('GD', 'Gestión Documental', 'GQ'),
('SR', 'Sistema de Administración del Riesgo - SAR', 'GQ'),
('GO', 'Gestión Operativa', 'GL_2'),
('GI', 'Gestión de Inventarios', 'GL_2'),
('EF', 'Dispensación', 'EF'),
('GV', 'Ventas', 'GV'),
('GL', 'Licitaciones', 'GV'),
('CT', 'Contabilidad', 'GF'),
('TE', 'Tesorería', 'GF'),
('PC', 'Cartera', 'GF'),
('RA', 'Recursos Administrativos', 'GF'),
('ACM', 'Auditoría de cuenta médicas', 'CM'),
('FR', 'Facturación y radicación', 'CM'),
('TH', 'Talento Humano', 'TH_2'),
('BI', 'Bienestar', 'TH_2'),
('SVG', 'Servicios Generales', 'TH_2'),
('SST', 'SGSST', 'TH_2'),
('DS', 'Desarrollo', 'TI'),
('SP', 'Soporte', 'TI'),
('GC', 'Planeación de la Compra', 'IN'),
('GIN', 'Gestión de la información', 'IN'),
('GP', 'Parametrización', 'IN'),
('CI2', 'Control Interno', 'CI');

INSERT INTO Solicitantes (nombre_completo) VALUES 
('Andres Varela'), ('Alejandro Ordoñez'), ('Alexander Rivera'), ('Angie Muñoz'), 
('Carlos Bustos'), ('Arley Mendez'), ('Claudia Buesaco'), ('Claudia Vargas'), 
('Cristian Muñoz'), ('Faber Mendez'), ('Jesus David Velazco'), ('Maria Eugenia Pescador'), 
('Monica Cajas'), ('Regente B/ Bolivar 5'), ('Regente B/ Bolivar 2'), ('Regente FOMAG 1'), 
('Regente Santa Clara 4'), ('Sandra Ruiz'), ('Tatiana Hernandez'), ('ZONAL CENTRO'), 
('ZONAL SUR'), ('ZONAL NORTE'), ('Asesor Juridico'), ('Ayda Matabajoy'), 
('Thristan Stiven Quintana León'), ('Eneida Samboni'), ('Daniela Hurtado');

INSERT INTO Responsable (nombre_completo, correo) VALUES 
('Alejandro Ordoñez', 'gestion.calidad@mennarsas.com.co'),
('Eneida Samboni', 'analista.calidad3@mennarsas.com.co'),
('Tatiana Hernandez', 'analista.calidad@mennarsas.com.co'),
('Maria Eugenia', 'maria.eugenia@mennarsas.com.co'),
('Ayda Matabajoy', 'gestion.documental@mennarsas.com.co'),
('Stiven Quintana León', 'auxiliar.documental@mennarsas.com.co');

-- Usuarios del sistema con su respectivo ID de rol (id_rol_fk)
INSERT INTO usuarios (nombre_completo, id_rol_fk, correo, password) VALUES 
('Alejandro Ordoñez', 4, 'gestion.calidad@mennarsas.com.co', 'Aordoñez'),
('Eneida Samboni', 1, 'analista.calidad3@mennarsas.com.co', 'Esamboni'),
('Tatiana Hernandez', 2, 'analista.calidad@mennarsas.com.co', 'Lhernandez'),
('Maria Eugenia Pescador', 2, 'analista.calidad2@mennarsas.com.co', 'Mpescador'),
('Ayda Matabajoy', 4, 'gestion.documental@mennarsas.com.co', 'Amatabajoy'),
('Stiven Quintana León', 3, 'auxiliar.documental@mennarsas.com.co', 'Tquintana');