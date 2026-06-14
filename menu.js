// menu.js

document.addEventListener('DOMContentLoaded', () => {
    const usuarioRecuperado = localStorage.getItem('usuarioContigo');
    
    if (!usuarioRecuperado) {
        window.location.href = 'index.html';
        return;
    }

    const usuario = JSON.parse(usuarioRecuperado);
    
    // Escribe el nombre del usuario arriba
    const pantallaNombre = document.getElementById('nombre-pantalla');
    if (pantallaNombre) {
        pantallaNombre.innerText = `${usuario.nombre} ${usuario.apellidos}`;
    }

    // --- FUNCIÓN DE CUMPLEAÑOS ---
    // Verificamos si hoy es el cumple del usuario
    if (usuario.fecha) {
        const hoy = new Date();
        const diaActual = hoy.getDate();
        const mesActual = hoy.getMonth() + 1; // Enero es 0
        const anoActual = hoy.getFullYear(); // <-- NUEVO: Obtenemos el año actual

        const partes = usuario.fecha.split('-'); // Formato YYYY-MM-DD
        const anoNacimiento = parseInt(partes[0], 10); // <-- NUEVO: Extraemos su año de nacimiento
        const mesNacimiento = parseInt(partes[1], 10);
        const diaNacimiento = parseInt(partes[2], 10);

        if (diaActual === diaNacimiento && mesActual === mesNacimiento) {
            // Calculamos la edad exacta
            const edad = anoActual - anoNacimiento;
            // ¡Es su cumpleaños! Lanzamos felicitación pasándole la edad
            mostrarFelicitacion(usuario.nombre, edad);
        }
    }

    // Botón Salir
    const btnSalir = document.getElementById('btn-salir');
    if (btnSalir) {
        btnSalir.addEventListener('click', () => {
            localStorage.removeItem('usuarioContigo');
            window.location.href = 'index.html?nocarga=true';
        });
    }
});

// Muestra el modal elegante y dispara el confeti
function mostrarFelicitacion(nombre, edad) {
    const modal = document.getElementById('modal-cumple');
    const texto = document.getElementById('texto-cumple');
    const btnCerrar = document.getElementById('btn-cerrar-cumple');

    // <-- NUEVO: Cambiamos el título h1 para incluir los años
    if (modal) {
        const titulo = modal.querySelector('h1');
        if (titulo) {
            titulo.innerText = `¡Feliz ${edad} cumpleaños! 🎉🎂`;
        }
    }

    if (texto) {
        texto.innerHTML = `¡Todo el equipo de <b>ConTigo</b> te desea un feliz cumpleaños y que pases un día maravilloso, ${nombre}! 🥳🎂`;
    }
    
    if (modal) modal.classList.remove('oculto');

    // Disparamos la animación larga y espectacular que querías
    dispararAnimacionConfeti();

    if (btnCerrar) {
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
