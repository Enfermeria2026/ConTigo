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

// --- Lógica de Carga Inteligente (A prueba de memoria caché) ---
const loader = document.getElementById('pantalla-carga');
const login = document.getElementById('pantalla-login');

if (loader && login) {
    const parametros = new URLSearchParams(window.location.search);
    if (parametros.get('nocarga') === 'true') {
        loader.style.display = 'none'; 
        login.classList.remove('oculto');
    } else {
        setTimeout(() => { 
            loader.style.display = 'none'; 
            login.classList.remove('oculto'); 
        }, 1200);
    }
}

// --- Elementos y Funciones Globales de Modales ---
const modal = document.getElementById('modal-aviso');
const textoModal = document.getElementById('texto-modal');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const contenedorConfirmar = document.getElementById('modal-botones-confirmar');
const btnConfirmarSi = document.getElementById('btn-confirmar-si');
const btnConfirmarNo = document.getElementById('btn-confirmar-no');

let redireccionarAlCerrar = false;
let datosTemporalesRegistro = null; 
let esHomonimoConfirmado = false;

function mostrarAviso(mensaje, redirigir = false, modoConfirmacion = false, textoBotonSi = "Sí, son correctos", textoBotonNo = "Modificar datos") {
    if (!modal || !textoModal) return; // Seguridad extra
    
    textoModal.innerHTML = mensaje;
    redireccionarAlCerrar = redirigir;
    
    if (modoConfirmacion) {
        if (btnCerrarModal) btnCerrarModal.classList.add('oculto');
        if (contenedorConfirmar) contenedorConfirmar.classList.remove('oculto');
        if (btnConfirmarSi) btnConfirmarSi.innerText = textoBotonSi;
        if (btnConfirmarNo) btnConfirmarNo.innerText = textoBotonNo;
    } else {
        if (btnCerrarModal) btnCerrarModal.classList.remove('oculto');
        if (contenedorConfirmar) contenedorConfirmar.classList.add('oculto');
    }
    modal.classList.remove('oculto');
}

// Botones generales del modal de avisos
if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', () => {
        modal.classList.add('oculto');
        if (redireccionarAlCerrar) window.location.href = 'index.html?nocarga=true';
    });
}

if (btnConfirmarNo) {
    btnConfirmarNo.addEventListener('click', () => {
        modal.classList.add('oculto');
        datosTemporalesRegistro = null;
        esHomonimoConfirmado = false;
    });
}

if (btnConfirmarSi) {
    btnConfirmarSi.addEventListener('click', async () => {
        if (!datosTemporalesRegistro) return;
        
        if (datosTemporalesRegistro.verificandoHomonimo) {
            modal.classList.add('oculto');
            esHomonimoConfirmado = true; 
            delete datosTemporalesRegistro.verificandoHomonimo; 
            guardarUsuarioEnBaseDeDatos(datosTemporalesRegistro);
            return;
        }

        modal.classList.add('oculto');
        await guardarUsuarioEnBaseDeDatos(datosTemporalesRegistro);
    });
}

async function guardarUsuarioEnBaseDeDatos(datos) {
    try {
        await addDoc(collection(db, "usuarios"), datos);
        datosTemporalesRegistro = null;
        esHomonimoConfirmado = false;
        mostrarAviso("¡Registro completado con éxito! Ahora puedes entrar a tu cuenta.", true);
    } catch (e) { 
        mostrarAviso("Hubo un error al guardar los datos de conexión."); 
    }
}

// --- LÓGICA: RECUPERAR IDENTIFICADOR ---
const linkOlvido = document.getElementById('link-olvido');
const modalRecuperar = document.getElementById('modal-recuperar');
const btnCerrarRec = document.getElementById('btn-cerrar-recuperar');
const paso1Rec = document.getElementById('recuperar-paso-1');
const paso2Rec = document.getElementById('recuperar-paso-2');
const cajaIdMostrado = document.getElementById('caja-id-mostrado');

if (linkOlvido && modalRecuperar) {
    linkOlvido.addEventListener('click', () => {
        // Limpiamos los campos al abrir
        const recN = document.getElementById('rec-nombre');
        const recA = document.getElementById('rec-apellidos');
        const recF = document.getElementById('rec-fecha');
        if(recN) recN.value = '';
        if(recA) recA.value = '';
        if(recF) recF.value = '';
        
        if(paso1Rec) paso1Rec.classList.remove('oculto');
        if(paso2Rec) paso2Rec.classList.add('oculto');
        modalRecuperar.classList.remove('oculto');
    });
}

if (btnCerrarRec && modalRecuperar) { 
    btnCerrarRec.addEventListener('click', () => modalRecuperar.classList.add('oculto')); 
}

const btnRecSiguiente = document.getElementById('btn-recuperar-siguiente');
if (btnRecSiguiente) {
    btnRecSiguiente.addEventListener('click', async () => {
        const n = document.getElementById('rec-nombre')?.value.trim();
        const a = document.getElementById('rec-apellidos')?.value.trim();
        const f = document.getElementById('rec-fecha')?.value;

        if (!n || !a || !f) return mostrarAviso("Rellena nombre, apellidos y fecha para buscarte.");

        try {
            const q = query(collection(db, "usuarios"), where("nombre", "==", n), where("apellidos", "==", a), where("fecha_nacimiento", "==", f));
            const consulta = await getDocs(q);

            if (consulta.empty) {
                mostrarAviso("No encontramos ninguna cuenta con esos datos. Revísalos bien.");
            } else {
                const datosUsuario = consulta.docs[0].data();
                if (cajaIdMostrado) cajaIdMostrado.innerText = datosUsuario.identificador;
                if (paso1Rec) paso1Rec.classList.add('oculto');
                if (paso2Rec) paso2Rec.classList.remove('oculto');
            }
        } catch (error) { mostrarAviso("Error de conexión."); }
    });
}

const btnCopiarId = document.getElementById('btn-copiar-id');
if (btnCopiarId && cajaIdMostrado) {
    btnCopiarId.addEventListener('click', () => {
        const idCopiar = cajaIdMostrado.innerText;
        navigator.clipboard.writeText(idCopiar).then(() => {
            mostrarAviso("¡Identificador copiado! Ya puedes pegarlo para iniciar sesión.");
            if (modalRecuperar) modalRecuperar.classList.add('oculto');
        }).catch(() => {
            mostrarAviso("No se pudo copiar automáticamente. Por favor, apúntalo en un papel.");
        });
    });
}

// --- LÓGICA DE REGISTRO CON DOBLE VERIFICACIÓN ---
const btnRegistrar = document.getElementById('btn-registrar');
if (btnRegistrar) {
    btnRegistrar.addEventListener('click', async () => {
        const nombre = document.getElementById('reg-nombre')?.value.trim();
        const apellidos = document.getElementById('reg-apellidos')?.value.trim();
        const fecha = document.getElementById('reg-fecha')?.value;
        const id = document.getElementById('reg-id')?.value.trim();

        if (!nombre || !id || !apellidos || !fecha) return mostrarAviso("Por favor, rellena todos los campos antes de continuar.");

        try {
            const qIdentificador = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("identificador", "==", id));
            const consultaId = await getDocs(qIdentificador);
            
            if (!consultaId.empty) {
                return mostrarAviso("Ese Identificador ya está siendo usado por otra persona con el nombre '" + nombre + "'. Por favor, cambia tu Identificador.");
            }

            if (!esHomonimoConfirmado) {
                const qHomonimo = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("apellidos", "==", apellidos), where("fecha_nacimiento", "==", fecha));
                const consultaHomonimo = await getDocs(qHomonimo);

                if (!consultaHomonimo.empty) {
                    datosTemporalesRegistro = { nombre, apellidos, fecha, identificador: id, verificandoHomonimo: true };
                    const mensajeHomonimo = `<strong>⚠️ Cuenta similar encontrada</strong><br><br>Ya existe alguien registrado en el sistema con tu mismo nombre, apellidos y fecha de nacimiento.<br><br><b>¿Eres una persona diferente que se está registrando por primera vez?</b>`;
                    return mostrarAviso(mensajeHomonimo, false, true, "Sí, soy otra persona", "No, volver atrás");
                }
            }

            datosTemporalesRegistro = { nombre, apellidos, fecha, identificador: id };
            const mensajeConfirmacion = `<strong>¿Son todos tus datos correctos?</strong><br><br>• <b>Nombre:</b> ${nombre}<br>• <b>Apellidos:</b> ${apellidos}<br>• <b>Identificador:</b> ${id}`;
            mostrarAviso(mensajeConfirmacion, false, true, "Sí, son correctos", "Modificar datos");

        } catch (e) { 
            mostrarAviso("Error al conectar con el sistema."); 
        }
    });
}

// --- Lógica de Login ---
const btnIniciar = document.getElementById('btn-iniciar');
if (btnIniciar) {
    btnIniciar.addEventListener('click', async () => {
        const nombre = document.getElementById('login-nombre')?.value.trim();
        const id = document.getElementById('login-id')?.value.trim();
        
        if (!nombre || !id) return mostrarAviso("Introduce tu nombre y tu Identificador.");
        
        try {
            const q = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("identificador", "==", id));
            const consulta = await getDocs(q);
            if (consulta.empty) mostrarAviso("No encontramos ninguna cuenta con esos datos. Revisa si están bien escritos.");
            else mostrarAviso("¡Bienvenido/a de nuevo, " + nombre + "!");
        } catch (e) { mostrarAviso("Error al verificar la cuenta."); }
    });
}
