// menu.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Extraemos los datos del usuario de la memoria del teléfono
    const usuarioRecuperado = localStorage.getItem('usuarioContigo');
    
    // Seguridad: Si intentan entrar escribiendo "menu.html" en la URL sin loguearse, los echa al inicio
    if (!usuarioRecuperado) {
        window.location.href = 'index.html';
        return;
    }

    const usuario = JSON.parse(usuarioRecuperado);
    
    // 2. Pintamos en la pantalla su Nombre y Apellidos completos
    const pantallaNombre = document.getElementById('nombre-pantalla');
    if (pantallaNombre) {
        pantallaNombre.innerText = `${usuario.nombre} ${usuario.apellidos}`;
    }

    // 3. Lanzamos la comprobación inteligente del cumpleaños
    verificarSiEsCumpleanos(usuario.nombre, usuario.fecha_nacimiento);

    // 4. Activamos el botón de Salir
    const btnSalir = document.getElementById('btn-salir');
    if (btnSalir) {
        btnSalir.addEventListener('click', () => {
            // Borramos la sesión por seguridad y volvemos a la pantalla de entrada
            localStorage.removeItem('usuarioContigo');
            window.location.href = 'index.html?nocarga=true';
        });
    }
});

// Función para comprobar el cumpleaños analizando el texto de Firebase (Ej: "2003-08-28")
function verificarSiEsCumpleanos(nombre, fechaBD) {
    if (!fechaBD) return;

    // Obtenemos el día y mes actual del mundo real
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesActual = hoy.getMonth() + 1; // En Javascript Enero es 0, sumamos 1

    // Rompemos el texto de la base de datos por los guiones
    const partes = fechaBD.split('-');
    if (partes.length !== 3) return;

    const mesNacimiento = parseInt(partes[1], 10);
    const diaNacimiento = parseInt(partes[2], 10);

    // Si coinciden el día y el mes exactos... ¡Es su día!
    if (diaActual === diaNacimiento && mesActual === mesNacimiento) {
        mostrarFelicitacion(nombre);
    }
}

// Muestra el modal elegante y dispara el confeti en ráfagas
function mostrarFelicitacion(nombre) {
    const modal = document.getElementById('modal-cumple');
    const texto = document.getElementById('texto-cumple');
    const btnCerrar = document.getElementById('btn-cerrar-cumple');

    if (texto) {
        texto.innerHTML = `¡Todo el equipo de <b>ConTigo</b> te desea un feliz cumpleaños y que pases un día maravilloso, ${nombre}! 🥳`;
    }
    
    if (modal) modal.classList.remove('oculto');

    // Disparamos la ráfaga de confeti de colores
    dispararAnimacionConfeti();

    if (btnCerrar && modal) {
        btnCerrar.addEventListener('click', () => {
            modal.classList.add('oculto');
        });
    }
}

// Configuración de la animación de confeti (Dura 4 segundos a los lados de la pantalla)
function dispararAnimacionConfeti() {
    var duration = 4 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 4000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        var particleCount = 50 * (timeLeft / duration);
        // Confeti desde el lado izquierdo inferior
        confetti(Object.assign({}, defaults, { particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        // Confeti desde el lado derecho inferior
        confetti(Object.assign({}, defaults, { particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 250);
}
