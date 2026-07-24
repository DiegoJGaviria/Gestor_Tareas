function esPaginaLogin() {
    const path = window.location.pathname.toLowerCase();
    return path.endsWith('/login.html') || path.endsWith('login.html');
}

document.addEventListener('DOMContentLoaded', () => {
    if (esPaginaLogin()) return;

    verificarSesionActiva();
    cargarMacroprocesos();
    cargarSolicitantes();
    cargarResponsables();
    cargarDashboardData();
    cargarModuloTareas();
    inicializarReportes();

    const macroSelect = document.getElementById('macroSelect');
    if(macroSelect) {
        macroSelect.addEventListener('change', function() {
            const macroId = this.value;
            if (macroId) cargarProcesosFiltrados(macroId, 'procesoSelect');
            else resetProcesosSelect();
        });
    }

    const filtroMacro = document.getElementById('filtroMacro');
    if (filtroMacro) {
        filtroMacro.addEventListener('change', function() {
            const macroId = this.value;
            if (macroId) {
                cargarProcesosFiltrados(macroId, 'filtroProceso');
            } else {
                const pSel = document.getElementById('filtroProceso');
                pSel.innerHTML = '<option value="">Todos los Procesos</option>';
                aplicarFiltrosReporte();
            }
        });
    }

    const btnAddSub = document.getElementById('btnAddSubtarea');
    if(btnAddSub) {
        btnAddSub.addEventListener('click', agregarFilaSubtarea);
        agregarFilaSubtarea();
    }

    const qForm = document.getElementById('qualityForm');
    if(qForm) qForm.addEventListener('submit', guardarActividadCompleta);
});

// ==========================================
// SEGURIDAD Y SESIONES
// ==========================================
async function verificarSesionActiva() {
    if (esPaginaLogin()) return;

    try {
        const res = await fetch('api.php?action=verificar_sesion');
        const data = await res.json();
        if (!data.logged) {
            window.location.replace('login.html');
        }
    } catch (e) {
        console.error('Error verificando sesión:', e);
    }
}

async function cerrarSesion() {
    await fetch('api.php?action=logout');
    window.location.replace('login.html');
}

// ==========================================
// NAVEGACIÓN Y VISTAS
// ==========================================
function cambiarVista(vistaId, btn) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        if (!b.classList.contains('logout-btn')) b.classList.remove('active');
    });
    const vista = document.getElementById(vistaId);
    if (vista) vista.classList.add('active');
    if (btn) btn.classList.add('active');
    
    if (vistaId === 'tareas') cargarModuloTareas();
    if (vistaId === 'reportes') aplicarFiltrosReporte();
}

function agregarFilaSubtarea() {
    const container = document.getElementById('subactividadesContainer');
    const div = document.createElement('div');
    div.className = 'subtarea-row';
    div.innerHTML = `
        <input type="text" placeholder="Nombre de la subtarea..." class="input-subnombre" required style="flex: 1; min-width: 0; margin: 0;">
        <input type="text" placeholder="Responsable de esta subtarea..." class="input-subresp" required style="flex: 1; min-width: 0; margin: 0;">
        <button type="button" class="btn-eliminar" onclick="this.parentElement.remove()" style="flex: 0 0 42px; height: 42px; min-height: 42px; padding: 0; display: inline-flex; align-items: center; justify-content: center; margin: 0; border-radius: 6px; background:#f472b6; color:#0f172a; border:none; cursor:pointer; font-weight:bold;">X</button>
    `;
    container.appendChild(div);
}

// ==========================================
// CATÁLOGOS
// ==========================================
async function cargarMacroprocesos() {
    try {
        const res = await fetch('api.php?action=get_macroprocesos');
        const data = await res.json();
        if (data.success) {
            const selectReg = document.getElementById('macroSelect');
            const selectRep = document.getElementById('filtroMacro');
            if (selectReg) selectReg.innerHTML = '<option value="">Seleccione un Macroproceso</option>';
            if (selectRep) selectRep.innerHTML = '<option value="">Todos los Macroprocesos</option>';
            
            data.data.forEach(m => {
                if (selectReg) selectReg.innerHTML += `<option value="${m.id_macro}">${m.nombre_macro}</option>`;
                if (selectRep) selectRep.innerHTML += `<option value="${m.id_macro}">${m.nombre_macro}</option>`;
            });
        }
    } catch (e) { console.error('Error:', e); }
}

async function cargarProcesosFiltrados(macroId, elementId = 'procesoSelect') {
    try {
        const procSel = document.getElementById(elementId);
        const res = await fetch(`api.php?action=get_procesos&macro_id=${macroId}`);
        const data = await res.json();
        const defaultText = elementId === 'procesoSelect' ? 'Seleccione un Proceso' : 'Todos los Procesos';
        
        procSel.innerHTML = `<option value="">${defaultText}</option>`;
        if (data.success && data.data.length > 0) {
            data.data.forEach(p => procSel.innerHTML += `<option value="${p.id_proceso}">${p.nombre_proceso}</option>`);
            if (elementId === 'procesoSelect') procSel.disabled = false;
        } else if (elementId === 'procesoSelect') {
            resetProcesosSelect();
        }
        if (elementId === 'filtroProceso') aplicarFiltrosReporte();
    } catch (e) { console.error('Error:', e); }
}

function resetProcesosSelect() {
    const procSel = document.getElementById('procesoSelect');
    if (procSel) {
        procSel.innerHTML = '<option value="">Seleccione primero un Macroproceso</option>';
        procSel.disabled = true;
    }
}

async function cargarSolicitantes() {
    try {
        const res = await fetch('api.php?action=get_solicitantes');
        const data = await res.json();
        if (data.success) {
            const sel = document.getElementById('solicitadoPor');
            const selRep = document.getElementById('filtroCreador');
            if (sel) sel.innerHTML = '<option value="">Seleccione solicitante...</option>';
            if (selRep) selRep.innerHTML = '<option value="">Todos los Creadores</option>';
            
            data.data.forEach(s => {
                if (sel) sel.innerHTML += `<option value="${s.nombre}">${s.nombre}</option>`;
                if (selRep) selRep.innerHTML += `<option value="${s.nombre}">${s.nombre}</option>`;
            });
        }
    } catch (e) { console.error('Error:', e); }
}

async function cargarResponsables() {
    try {
        const res = await fetch('api.php?action=get_responsables');
        const data = await res.json();
        if (data.success) {
            const sel = document.getElementById('responsable');
            const selRep = document.getElementById('filtroResponsable');
            if (sel) sel.innerHTML = '<option value="">Seleccione responsable...</option>';
            if (selRep) selRep.innerHTML = '<option value="">Todos los Responsables</option>';
            
            data.data.forEach(r => {
                if (sel) sel.innerHTML += `<option value="${r.nombre}">${r.nombre}</option>`;
                if (selRep) selRep.innerHTML += `<option value="${r.nombre}">${r.nombre}</option>`;
            });
        }
    } catch (e) { console.error('Error:', e); }
}

// ==========================================
// GUARDAR Y DASHBOARD
// ==========================================
async function guardarActividadCompleta(e) {
    e.preventDefault();
    const subactividades = [];
    document.querySelectorAll('.subtarea-row').forEach(row => {
        subactividades.push({
            nombre_sub: row.querySelector('.input-subnombre').value,
            responsable_sub: row.querySelector('.input-subresp').value
        });
    });

    if (subactividades.length === 0) {
        alert('Debe agregar al menos una subtarea.');
        return;
    }

    const nombreActividad = document.getElementById('nombreActividad').value.trim();
    const solicitadoPor = document.getElementById('solicitadoPor').value;
    const responsable = document.getElementById('responsable').value;
    const procesoRef = document.getElementById('procesoSelect').value;

    if (!nombreActividad || !solicitadoPor || !responsable || !procesoRef) {
        alert('Debe completar todos los campos del formulario.');
        return;
    }

    const payload = {
        nombre_actividad: nombreActividad,
        solicitado_por: solicitadoPor,
        responsable: responsable,
        proceso_ref: procesoRef,
        subactividades: subactividades
    };

    try {
        const res = await fetch('api.php?action=guardar_actividad', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
            alert('¡Actividad registrada con éxito!');
            document.getElementById('qualityForm').reset();
            document.getElementById('subactividadesContainer').innerHTML = '';
            agregarFilaSubtarea();
            resetProcesosSelect();
            cargarDashboardData();
        } else {
            alert('Error al guardar: ' + result.error);
        }
    } catch (error) { console.error('Error:', error); }
}

// CORRECCIÓN 3: Se unificó al endpoint 'get_actividades'
async function cargarDashboardData() {
    try {
        const res = await fetch('api.php?action=get_actividades');
        const data = await res.json();
        if (data.success) {
            const actividades = data.data;
            const totalElem = document.getElementById('kpiTotalAct');
            const detalleElem = document.getElementById('kpiDetalle');
            const fechaElem = document.getElementById('kpiFecha');
            const estadoElem = document.getElementById('kpiEstado');

            if (totalElem) totalElem.textContent = actividades.length;
            if (fechaElem) fechaElem.textContent = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            if (estadoElem) estadoElem.textContent = actividades.length > 0 ? 'Activo' : 'Operativo';
            
            if (actividades.length > 0) {
                let suma = actividades.reduce((acc, curr) => acc + parseFloat(curr.porcentaje_total || 0), 0);
                let promedio = suma / actividades.length;
                
                document.getElementById('kpiProgreso').textContent = `${promedio.toFixed(1)}%`;
                document.getElementById('progressBar').style.width = `${promedio}%`;
                document.getElementById('progressText').textContent = `${promedio.toFixed(1)}% Completado`;
                if (detalleElem) detalleElem.textContent = `${actividades.length} actividades registradas con avance consolidado`;
            } else {
                document.getElementById('kpiProgreso').textContent = '0%';
                document.getElementById('progressBar').style.width = '0%';
                document.getElementById('progressText').textContent = '0% Completado';
                if (detalleElem) detalleElem.textContent = 'Sin registros aún';
            }
        }
    } catch (e) { console.error('Error dashboard:', e); }
}

async function cargarModuloTareas() {
    try {
        const res = await fetch('api.php?action=get_actividades');
        const data = await res.json();
        const tbody = document.querySelector('#tablaTareas tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        if (data.success && data.data.length > 0) {
            data.data.forEach(t => {
                tbody.innerHTML += `
                    <tr>
                        <td>#${t.id_actividad}</td>
                        <td><b>${t.nombre_actividad}</b></td>
                        <td><small style="color:#38bdf8;">${t.nombre_macro || 'N/A'}</small><br>${t.nombre_proceso || t.proceso_ref}</td>
                        <td><b>Solicita:</b> ${t.solicitado_por || '-'}<br><b>Creado por:</b> ${t.creado_por || '-'}<br><b>Resp:</b> ${t.responsable || '-'}</td>
                        <td><span style="color:#34d399; font-weight:bold;">${parseFloat(t.porcentaje_total || 0).toFixed(1)}%</span></td>
                    </tr>`;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay tareas almacenadas.</td></tr>';
        }
    } catch (e) { console.error('Error tareas:', e); }
}

// ==========================================
// REPORTES AVANZADOS
// ==========================================
function inicializarReportes() { aplicarFiltrosReporte(); }

async function aplicarFiltrosReporte() {
    const macroEl = document.getElementById('filtroMacro');
    const procesoEl = document.getElementById('filtroProceso');
    const respEl = document.getElementById('filtroResponsable');
    const creadorEl = document.getElementById('filtroCreador');
    const tbody = document.querySelector('#tablaReportes tbody');
    const statTotal = document.getElementById('statTotalItems');
    const statPromedio = document.getElementById('statPromedioFiltrado');

    if (!tbody) return;

    const macro = macroEl ? macroEl.value : '';
    const proceso = procesoEl ? procesoEl.value : '';
    const responsable = respEl ? respEl.value : '';
    const creador = creadorEl ? creadorEl.value : '';

    let url = `api.php?action=get_reportes&macro_id=${macro}&proceso_id=${proceso}&responsable=${encodeURIComponent(responsable)}&creado_por=${encodeURIComponent(creador)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        tbody.innerHTML = '';

        if (data.success) {
            const reportes = data.data || [];
            if (statTotal) statTotal.textContent = `Actividades filtradas: ${data.estadisticas?.total_actividades || 0}`;
            if (statPromedio) statPromedio.textContent = `Promedio de avance del filtro: ${data.estadisticas?.promedio_general || 0}%`;

            if (reportes.length > 0) {
                reportes.forEach(r => {
                    let porcentaje = parseFloat(r.porcentaje_total || 0).toFixed(1);
                    tbody.innerHTML += `
                        <tr>
                            <td><b>${r.nombre_actividad}</b></td>
                            <td><small style="color:#38bdf8;">${r.nombre_macro || ''}</small><br>${r.nombre_proceso || ''}</td>
                            <td>${r.solicitado_por || ''}<br><small style="color:#94a3b8;">Creado por: ${r.creado_por || '-'}</small></td>
                            <td>${r.responsable || ''}</td>
                            <td>${r.total_subactividades || 0} tareas</td>
                            <td><span style="color:#34d399; font-weight:bold;">${porcentaje}%</span></td>
                        </tr>`;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No se encontraron registros con los filtros seleccionados.</td></tr>';
            }
        }
    } catch (e) { console.error('Error reportes:', e); }
}