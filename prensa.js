// prensa.js - Lógica para la sección de Prensa y la ventana emergente de cookies

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Configurar el botón de Volver
    const btnVolver = document.getElementById('btn-volver-prensa');
    if (btnVolver) {
        btnVolver.onclick = () => {
            window.location.href = 'menu.html';
        };
    }

    // 2. Lógica de la ventana emergente (Modal) de Bienvenida / Cookies
    const modalCookies = document.getElementById('modal-cookies');
    const btnEntendido = document.getElementById('btn-entendido-cookies');

    // Comprobamos en el "localStorage" si ya han aceptado este aviso antes
    const avisoAceptado = localStorage.getItem('avisoPrensaCookiesVisto');

    // Si NO lo han aceptado nunca (es su primera vez en la pantalla)
    if (!avisoAceptado) {
        // Quitamos la clase que lo oculta para que se muestre en pantalla
        modalCookies.classList.remove('modal-oculto');
    }

    // Cuando el usuario pulsa en "¡Entendido!"
    if (btnEntendido) {
        btnEntendido.onclick = () => {
            // Guardamos en la memoria que ya lo han visto para que no vuelva a salir
            localStorage.setItem('avisoPrensaCookiesVisto', 'true');
            // Ocultamos la ventana emergente
            modalCookies.classList.add('modal-oculto');
        };
    }

    // Nota de accesibilidad: Los enlaces de los periódicos (<a target="_blank">) 
    // funcionan solos gracias al HTML, no hace falta programarlos aquí en el JS.
});
