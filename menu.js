// menu.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyApIiwYA_uSsiEGkD7N7CZUCQkScPsmrZU",
    authDomain: "contigo-96ced.firebaseapp.com",
    projectId: "contigo-96ced",
    storageBucket: "contigo-96ced.firebasestorage.app",
    messagingSenderId: "26960662171",
    appId: "1:26960662171:web:e9dd52e4263f8770d9003e",
    measurementId: "G-7NDPMZ5EGR"
};
const db = getFirestore(initializeApp(firebaseConfig));

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

        // --- 1. EL BOTÓN SOS (112) ---
    const btnSos = document.getElementById('btn-sos');
    if (btnSos) {
        btnSos.addEventListener('click', () => {
            window.location.href = "tel:112";
        });
    }

    // --- 2. LOS CONTACTOS FAVORITOS ---
    const btnFav1 = document.getElementById('btn-fav1');
    const btnFav2 = document.getElementById('btn-fav2');
    let botonSeleccionado = null; 

    // Plantilla para que el nombre quede arriba, el número abajo, y NO rompa el botón
    function crearHtmlBoton(nombre, telefono) {
        return `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; overflow:hidden;">
                <strong style="font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${nombre}</strong>
                <span style="font-size: 1rem; opacity: 0.8; margin-top: 2px;">${telefono}</span>
            </div>
        `;
    }

    function pintarBotonesFavoritos() {
        if (usuario.fav1) {
            btnFav1.innerHTML = crearHtmlBoton(usuario.fav1.nombre, usuario.fav1.telefono);
            btnFav1.style.backgroundColor = "var(--pastel-azul)";
        } else {
            btnFav1.innerHTML = `+ Añadir<br>contacto`;
            btnFav1.style.backgroundColor = ""; 
        }

        if (usuario.fav2) {
            btnFav2.innerHTML = crearHtmlBoton(usuario.fav2.nombre, usuario.fav2.telefono);
            btnFav2.style.backgroundColor = "var(--pastel-verde)";
        } else {
            btnFav2.innerHTML = `+ Añadir<br>contacto`;
            btnFav2.style.backgroundColor = "";
        }
    }
    pintarBotonesFavoritos();

    function gestionarClicFavorito(num) {
        botonSeleccionado = num;
        const datosContacto = num === 1 ? usuario.fav1 : usuario.fav2;
        
        if (datosContacto) {
            document.getElementById('titulo-opciones-fav').innerText = datosContacto.nombre;
            document.getElementById('modal-opciones-fav').classList.remove('oculto');
        } else {
            abrirFormularioFavorito();
        }
    }
    btnFav1.addEventListener('click', () => gestionarClicFavorito(1));
    btnFav2.addEventListener('click', () => gestionarClicFavorito(2));

    // --- 3. FUNCIONES DE LAS VENTANAS Y AGENDA ---
    const modalOpciones = document.getElementById('modal-opciones-fav');
    const modalFormulario = document.getElementById('modal-formulario-fav');

    document.getElementById('btn-opcion-cancelar').onclick = () => modalOpciones.classList.add('oculto');
    document.getElementById('btn-cancelar-formulario-fav').onclick = () => modalFormulario.classList.add('oculto');

    document.getElementById('btn-opcion-llamar').onclick = () => {
        const telefono = botonSeleccionado === 1 ? usuario.fav1.telefono : usuario.fav2.telefono;
        window.location.href = `tel:${telefono}`;
        modalOpciones.classList.add('oculto');
    };

    function abrirFormularioFavorito() {
        const datosContacto = botonSeleccionado === 1 ? usuario.fav1 : usuario.fav2;
        document.getElementById('titulo-formulario-fav').innerText = datosContacto ? "Editar Contacto" : "Añadir Contacto";
        document.getElementById('input-fav-nombre').value = datosContacto ? datosContacto.nombre : "";
        document.getElementById('input-fav-tel').value = datosContacto ? datosContacto.telefono : "";
        document.getElementById('error-fav').classList.add('oculto');
        
        modalOpciones.classList.add('oculto');
        modalFormulario.classList.remove('oculto');
    }
    document.getElementById('btn-opcion-editar').onclick = abrirFormularioFavorito;

    document.getElementById('btn-opcion-eliminar').onclick = async () => {
        document.getElementById('btn-opcion-eliminar').innerText = "Borrando...";
        if (botonSeleccionado === 1) delete usuario.fav1;
        else delete usuario.fav2;
        
        await guardarFavoritoFirebase();
        pintarBotonesFavoritos();
        
        document.getElementById('btn-opcion-eliminar').innerText = "🗑️ Eliminar";
        modalOpciones.classList.add('oculto');
    };

    // --- CONEXIÓN CON LA AGENDA DEL MÓVIL ---
    const btnAgenda = document.getElementById('btn-agenda-fav');
    // Si el móvil permite leer la agenda (Android), activamos el botón
    if ('contacts' in navigator && 'ContactsManager' in window) {
        btnAgenda.onclick = async () => {
            try {
                const contactos = await navigator.contacts.select(['name', 'tel'], { multiple: false });
                if (contactos.length > 0) {
                    const nombreElegido = contactos[0].name[0] || '';
                    let tlfElegido = contactos[0].tel[0] || '';
                    // Limpiamos el teléfono (+34, espacios, guiones)
                    tlfElegido = tlfElegido.replace('+34', '').replace(/[\s-]/g, '');
                    
                    document.getElementById('input-fav-nombre').value = nombreElegido;
                    document.getElementById('input-fav-tel').value = tlfElegido;
                }
            } catch (error) {
                console.log("Acceso a la agenda cancelado o denegado.");
            }
        };
    } else {
        // Si el móvil lo bloquea (iPhone), ocultamos el botón para no confundir
        btnAgenda.style.display = 'none';
    }

    // --- GUARDAR CON VERIFICACIÓN DE 9 DÍGITOS ---
    document.getElementById('btn-guardar-fav').onclick = async () => {
        const nombre = document.getElementById('input-fav-nombre').value.trim();
        const telRoto = document.getElementById('input-fav-tel').value.trim();
        const msgError = document.getElementById('error-fav');

        // Quitamos espacios por si escriben "600 12 34 56"
        const telLimpio = telRoto.replace(/\s+/g, '');

        if (!nombre || !telLimpio) {
            msgError.innerText = "Por favor, rellena el nombre y el teléfono.";
            msgError.classList.remove('oculto');
            return;
        }

        // Comprobamos que sean exactamente 9 números y no letras
        if (telLimpio.length !== 9 || isNaN(telLimpio)) {
            msgError.innerText = "El teléfono debe tener 9 números exactos.";
            msgError.classList.remove('oculto');
            return;
        }

        document.getElementById('btn-guardar-fav').innerText = "Guardando...";
        const contacto = { nombre: nombre, telefono: telLimpio };
        if (botonSeleccionado === 1) usuario.fav1 = contacto;
        else usuario.fav2 = contacto;

        await guardarFavoritoFirebase();
        pintarBotonesFavoritos();
        
        document.getElementById('btn-guardar-fav').innerText = "Guardar";
        modalFormulario.classList.add('oculto');
    };

    // --- 4. GUARDAR EN FIREBASE DE FONDO ---
    async function guardarFavoritoFirebase() {
        try {
            const q = query(collection(db, "usuarios"), 
                where("identificador_normalizado", "==", usuario.identificador_normalizado)
            );
            const consulta = await getDocs(q);
            if (!consulta.empty) {
                await updateDoc(consulta.docs[0].ref, {
                    fav1: usuario.fav1 || null,
                    fav2: usuario.fav2 || null
                });
                localStorage.setItem('usuarioContigo', JSON.stringify(usuario));
            }
        } catch (e) {
            console.error("Fallo al guardar", e);
        }
    }
        
    }

    // --- FUNCIÓN DE CUMPLEAÑOS ---
    const acabaDeEntrar = localStorage.getItem('acabaDeEntrar');
    
    // Solo comprobamos el cumple si trae el ticket de haber iniciado sesión o registrado AHORA MISMO
    if (acabaDeEntrar === 'true') {
        // Quemamos el ticket al instante para que no vuelva a salir si vamos al perfil y volvemos
        localStorage.removeItem('acabaDeEntrar'); 
        
        // Buscamos la fecha, se llame como se llame en la base de datos
        const fechaGuardada = usuario.fecha_nacimiento || usuario.fecha;

        if (fechaGuardada) {
            const hoy = new Date();
            const diaActual = hoy.getDate();
            const mesActual = hoy.getMonth() + 1; // Enero es 0
            const anoActual = hoy.getFullYear(); // Obtenemos el año actual

            const partes = fechaGuardada.split('-'); // Formato YYYY-MM-DD
            const anoNacimiento = parseInt(partes[0], 10); 
            const mesNacimiento = parseInt(partes[1], 10);
            const diaNacimiento = parseInt(partes[2], 10);

            if (diaActual === diaNacimiento && mesActual === mesNacimiento) {
                // Calculamos la edad exacta
                const edad = anoActual - anoNacimiento;
                // ¡Es su cumpleaños! Lanzamos felicitación pasándole la edad
                mostrarFelicitacion(usuario.nombre, edad);
            }
        }
    }
    
// Botón Perfil
    const btnPerfil = document.getElementById('btn-perfil');
    if (btnPerfil) {
        btnPerfil.addEventListener('click', () => {
            window.location.href = 'perfil.html';
        });
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

// --- TUTORIAL GUIADO PARA USUARIOS NUEVOS ---
document.addEventListener('DOMContentLoaded', () => {
    // Comprobamos si el usuario es nuevo
    const necesitaTutorial = localStorage.getItem('necesitaTutorial');
    
    if (necesitaTutorial === 'true') {
        iniciarTutorial();
    }
});

function iniciarTutorial() {
    const pasos = [
        {
            titulo: "¡Bienvenido/a a ConTigo! 👋",
            texto: "Esta es tu nueva aplicación. Está diseñada para ser muy fácil de usar. Puedes ver todo lo que hay en la pantalla <b>deslizando tu dedo hacia arriba o hacia abajo</b>."
        },
        {
            titulo: "Tus Aplicaciones 📱",
            texto: "Aquí tienes botones grandes de colores. Cada botón hace una cosa: ver el tiempo, leer la prensa... Solo tienes que <b>tocar el que quieras usar</b>."
        },
        {
            titulo: "Emergencias y Familia 🚨",
            texto: "Arriba del todo tienes botones para añadir a tus familiares favoritos y un <b>botón ROJO de Emergencias</b> que te conectará rápido si necesitas ayuda urgente."
        },
        {
            titulo: "Último paso: Tu Perfil 👤",
            texto: "Para que funcionen cosas como 'Transporte Local', 'Farmacias de guardia' o 'Eventos cerca de ti', necesitamos saber dónde vives. <b>Vamos a ir a tu Perfil para rellenar esos datos</b>. ¡Es muy fácil!"
        }
    ];

    let pasoActual = 0;
    const modalTut = document.getElementById('modal-tutorial');
    const tituloTut = document.getElementById('tutorial-titulo');
    const textoTut = document.getElementById('tutorial-texto');
    const indicadorTut = document.getElementById('tutorial-indicador');
    const btnSiguienteTut = document.getElementById('btn-tutorial-siguiente');

    if (!modalTut) return;

    function mostrarPaso() {
        tituloTut.innerText = pasos[pasoActual].titulo;
        textoTut.innerHTML = pasos[pasoActual].texto;
        indicadorTut.innerText = `Paso ${pasoActual + 1} de ${pasos.length}`;
        
        if (pasoActual === pasos.length - 1) {
            btnSiguienteTut.innerText = "¡Ir a mi perfil!";
            btnSiguienteTut.style.backgroundColor = "#F39C12"; 
            btnSiguienteTut.style.color = "white";
        } else {
            btnSiguienteTut.innerText = "Siguiente";
        }
    }

    modalTut.classList.remove('oculto');
    mostrarPaso();

    // AQUÍ ESTÁ LA CLAVE: Usamos onclick para machacar cualquier orden antigua
    btnSiguienteTut.onclick = () => {
        if (pasoActual < pasos.length - 1) {
            pasoActual++;
            mostrarPaso();
        } else {
            // 1. Borramos el tutorial del menú
            localStorage.removeItem('necesitaTutorial');
            // 2. PASAMOS EL TESTIGO: Activamos el tutorial del perfil
            localStorage.setItem('tutorialPerfil', 'true');
            // 3. Vamos al perfil
            window.location.replace('perfil.html');
        }
    };
}

// --- BOTÓN DE PRENSA ---
    const btnPrensa = document.getElementById('btn-prensa');
    if (btnPrensa) {
        btnPrensa.onclick = () => {
            window.location.href = 'prensa.html';
        };
    }


