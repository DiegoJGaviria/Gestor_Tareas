document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombreUsuario').value.trim();
        const password = document.getElementById('password').value;

        if (!nombre || !password) {
            alert('Debe ingresar usuario y contraseña.');
            return;
        }

        try {
            const response = await fetch('api.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, password })
            });
            const result = await response.json();

            if (result.success) {
                window.location.href = 'index.html';
            } else {
                alert('Acceso denegado: ' + result.error);
            }
        } catch (error) {
            console.error('Error en el login:', error);
            alert('No se pudo iniciar sesión. Intente nuevamente.');
        }
    });
});