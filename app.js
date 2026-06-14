import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// --- Elementos del Modal de Avisos ---
const modal = document.getElementById('modal-aviso');
const textoModal = document.getElementById('texto-modal');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const contenedorConfirmar = document.getElementById('modal-botones-confirmar');
const btnConfirmarSi = document.getElementById('btn-confirmar-si');
const btnConfirmarNo = document.getElementById('btn-confirmar-no');
let redireccionarAlCerrar = false;
let datosTemporalesRegistro = null; 

function mostrarAviso(mensaje, redirigir = false, modoConfirmacion = false) {
    textoModal.innerHTML = mensaje;
    redireccionarAlCerrar = redirigir;
    if (modoConfirmacion) {
        btnCerrarModal.classList.add('oculto');
        contenedorConfirmar.classList.remove('oculto');
    } else {
        btnCerrarModal.classList.remove('oculto');
        contenedorConfirmar.classList.add('oculto');
    }
    modal.classList.remove('oculto');
}

if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', () => {
        modal.classList.add('oculto');
        if (redireccionarAlCerrar) window.location.href = 'index.html?nocarga=true';
    });
}
if (btnConfirmarNo) { btnConfirmarNo.addEventListener('click', () => { modal.classList.add('oculto'); datosTemporalesRegistro = null; }); }
if (btnConfirmarSi) {
    btnConfirmarSi.addEventListener('click', async () => {
        if (!datosTemporalesRegistro) return;
        modal.classList.add('oculto');
        try {
            await addDoc(collection(db, "usuarios"), datosTemporalesRegistro);
            datosTemporalesRegistro = null;
            mostrarAviso("¡Registro completado con éxito! Ahora puedes entrar a tu cuenta.", true);
        } catch (e) { mostrarAviso("Hubo un error al guardar los datos."); }
    });
}

// --- Lógica de Carga Inteligente ---
window.addEventListener('load', () => {
    const loader = document.getElementById('pantalla-carga');
    const login = document.getElementById('pantalla-login');
    if (loader && login) {
        const parametros = new URLSearchParams(window.location.search);
        if (parametros.get('nocarga') === 'true') {
            loader.style.display = 'none'; login.classList.remove('oculto');
        } else {
            setTimeout(() => { loader.style.display = 'none'; login.classList.remove('oculto'); }, 1200);
        }
    }
});

// --- LÓGICA: RECUPERAR IDENTIFICADOR ---
const linkOlvido = document.getElementById('link-olvido');
const modalRecuperar = document.getElementById('modal-recuperar');
const btnCerrarRec = document.getElementById('btn-cerrar-recuperar');
const paso1Rec = document.getElementById('recuperar-paso-1');
const paso2Rec = document.getElementById('recuperar-paso-2');
const cajaIdMostrado = document.getElementById('caja-id-mostrado');

// Abrir modal y limpiar campos
if (linkOlvido) {
    linkOlvido.addEventListener('click', () => {
        document.getElementById('rec-nombre').value = '';
        document.getElementById('rec-apellidos').value = '';
        document.getElementById('rec-fecha').value = '';
        paso1Rec.classList.remove('oculto');
        paso2Rec.classList.add('oculto');
        modalRecuperar.classList.remove('oculto');
    });
}

// Cerrar modal de recuperación con la cruz
if (btnCerrarRec) {
    btnCerrarRec.addEventListener('click', () => {
        modalRecuperar.classList.add('oculto');
    });
}

// Paso 1: Buscar datos
document.getElementById('btn-recuperar-siguiente')?.addEventListener('click', async () => {
    const n = document.getElementById('rec-nombre').value.trim();
    const a = document.getElementById('rec-apellidos').value.trim();
    const f = document.getElementById('rec-fecha').value;

    if (!n || !a || !f) return mostrarAviso("Rellena nombre, apellidos y fecha para buscarte.");

    try {
        const q = query(collection(db, "usuarios"), where("nombre", "==", n), where("apellidos", "==", a), where("fecha_nacimiento", "==", f));
        const consulta = await getDocs(q);

        if (consulta.empty) {
            mostrarAviso("No encontramos ninguna cuenta con esos datos. Revísalos bien.");
        } else {
            // Extraer el identificador del primer resultado encontrado en la base de datos
            const datosUsuario = consulta.docs[0].data();
            cajaIdMostrado.innerText = datosUsuario.identificador;
            
            // Pasar a la pantalla de mostrar el ID
            paso1Rec.classList.add('oculto');
            paso2Rec.classList.remove('oculto');
        }
    } catch (error) { mostrarAviso("Error de conexión."); }
});

// Botón Copiar al Portapapeles
document.getElementById('btn-copiar-id')?.addEventListener('click', () => {
    const idCopiar = cajaIdMostrado.innerText;
    navigator.clipboard.writeText(idCopiar).then(() => {
        mostrarAviso("¡Identificador copiado! Ya puedes pegarlo para iniciar sesión.");
        modalRecuperar.classList.add('oculto'); // Opcional: cierra el cuadro al copiar
    }).catch(() => {
        mostrarAviso("No se pudo copiar automáticamente. Por favor, apúntalo en un papel.");
    });
});

// --- Lógica de Registro (se mantiene igual) ---
const btnRegistrar = document.getElementById('btn-registrar');
if (btnRegistrar) {
    btnRegistrar.addEventListener('click', async () => {
        const nombre = document.getElementById('reg-nombre').value.trim();
        const apellidos = document.getElementById('reg-apellidos').value.trim();
        const fecha = document.getElementById('reg-fecha').value;
        const id = document.getElementById('reg-id').value.trim();

        if (!nombre || !id || !apellidos || !fecha) return mostrarAviso("Por favor, rellena todos los campos antes de continuar.");

        try {
            const q = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("identificador", "==", id));
            const consulta = await getDocs(q);
            if (!consulta.empty) {
                mostrarAviso("Ese Identificador ya está siendo usado por otra persona. Por favor, cambia tu Identificador.");
            } else {
                datosTemporalesRegistro = { nombre, apellidos, fecha, identificador: id };
                const mensajeConfirmacion = `<strong>¿Son todos tus datos correctos?</strong><br><br>• <b>Nombre:</b> ${nombre}<br>• <b>Apellidos:</b> ${apellidos}<br>• <b>Identificador:</b> ${id}`;
                mostrarAviso(mensajeConfirmacion, false, true);
            }
        } catch (e) { mostrarAviso("Error al conectar con el sistema."); }
    });
}

// --- Lógica de Login (se mantiene igual) ---
const btnIniciar = document.getElementById('btn-iniciar');
if (btnIniciar) {
    btnIniciar.addEventListener('click', async () => {
        const nombre = document.getElementById('login-nombre').value.trim();
        const id = document.getElementById('login-id').value.trim();
        if (!nombre || !id) return mostrarAviso("Introduce tu nombre y tu Identificador.");
        try {
            const q = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("identificador", "==", id));
            const consulta = await getDocs(q);
            if (consulta.empty) mostrarAviso("No encontramos ninguna cuenta con esos datos. Revisa si están bien escritos.");
            else mostrarAviso("¡Bienvenido/a de nuevo, " + nombre + "!");
        } catch (e) { mostrarAviso("Error al verificar la cuenta."); }
    });
}
