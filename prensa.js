// prensa.js - Lógica para la sección de Prensa y el mini-tutorial

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Configurar el botón de Volver
    const btnVolver = document.getElementById('btn-volver-prensa');
    if (btnVolver) {
        btnVolver.onclick = () => {
            window.location.href = 'menu.html';
        };
    }

    // 2. Elementos del tutorial de bienvenida
    const modalCookies = document.getElementById('modal-cookies');
    const paso1 = document.getElementById('paso-1-prensa');
    const paso2 = document.getElementById('paso-2-prensa');
    
    const btnSiguiente = document.getElementById('btn-siguiente-prensa');
    const btnEntendido = document.getElementById('btn-entendido-cookies');

    // Comprobamos si es la primera vez que entran
    const avisoAceptado = localStorage.getItem('avisoPrensaCookiesVisto');

    // Si es su primera vez, mostramos la ventana principal
    if (!avisoAceptado) {
        modalCookies.classList.remove('modal-oculto');
    }

    // Al pulsar "Siguiente paso" en el aviso de Cookies (Paso 1)
    if (btnSiguiente) {
        btnSiguiente.onclick = () => {
            paso1.classList.add('modal-oculto');    // Escondemos las cookies
            paso2.classList.remove('modal-oculto'); // Enseñamos lo de deslizar
        };
    }

    // Al pulsar "¡Entendido!" en el aviso de Deslizar (Paso 2)
    if (btnEntendido) {
        btnEntendido.onclick = () => {
            // Guardamos en la memoria que ya lo han visto todo
            localStorage.setItem('avisoPrensaCookiesVisto', 'true');
            // Ocultamos la ventana por completo para siempre
            modalCookies.classList.add('modal-oculto');
        };
    }

});
