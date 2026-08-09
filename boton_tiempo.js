// boton_tiempo.js - Controla el acceso a la app del Tiempo desde el Menú

document.addEventListener('DOMContentLoaded', () => {
    const btnTiempo = document.getElementById('btn-tiempo');
    const modalLocalidad = document.getElementById('modal-falta-localidad');
    const btnIrPerfil = document.getElementById('btn-ir-perfil-tiempo');
    const btnCancelar = document.getElementById('btn-cancelar-tiempo');

    if (btnTiempo) {
        btnTiempo.addEventListener('click', () => {
            const usuarioRecuperado = localStorage.getItem('usuarioContigo');
            if (usuarioRecuperado) {
                const usuario = JSON.parse(usuarioRecuperado);
                // Si no tiene localidad guardada, mostramos el aviso
                if (!usuario.localidad || usuario.localidad === "") {
                    modalLocalidad.classList.remove('oculto');
                } else {
                    // Si la tiene, viajamos a la pantalla del Tiempo
                    window.location.href = 'tiempo.html';
                }
            }
        });
    }

    if (btnIrPerfil) {
        btnIrPerfil.addEventListener('click', () => {
            window.location.href = 'perfil.html';
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            modalLocalidad.classList.add('oculto');
        });
    }
});
