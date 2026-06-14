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

// --- Elementos del Modal ---
const modal = document.getElementById('modal-aviso');
const textoModal = document.getElementById('texto-modal');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const contenedorConfirmar = document.getElementById('modal-botones-confirmar');
const btnConfirmarSi = document.getElementById('btn-confirmar-si');
const btnConfirmarNo = document.getElementById('btn-confirmar-no');

let redireccionarAlCerrar = false;
let datosTemporalesRegistro = null; // Para guardar los datos antes de confirmar

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

// Cerrar modal normal
if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', () => {
        modal.classList.add('oculto');
        if (redireccionarAlCerrar) window.location.href = 'index.html?nocarga=true';
    });
}

// Botones del cuadro de confirmación de datos
if (btnConfirmarNo) {
    btnConfirmarNo.addEventListener('click', () => {
        modal.classList.add('oculto'); // Cierra el cuadro para que modifiquen
        datosTemporalesRegistro = null;
    });
}

if (btnConfirmarSi) {
    btnConfirmarSi.addEventListener('click', async () => {
        if (!datosTemporalesRegistro) return;
        modal.classList.add('oculto'); // Oculta temporalmente mientras guarda
        
        try {
            // Guardar definitivamente en Firebase
            await addDoc(collection(db, "usuarios"), datosTemporalesRegistro);
            datosTemporalesRegistro = null;
            mostrarAviso("¡Registro completado con éxito! Ahora puedes entrar a tu cuenta.", true);
        } catch (e) {
            mostrarAviso("Hubo un error al guardar los datos de conexión.");
        }
    });
}

// --- Lógica de Carga Inteligente ---
window.addEventListener('load', () => {
    const loader = document.getElementById('pantalla-carga');
    const login = document.getElementById('pantalla-login');
    
    if (loader && login) {
        // Revisar si venimos de pulsar "Volver" (URL contiene nocarga=true)
        const parametros = new URLSearchParams(window.location.search);
        if (parametros.get('nocarga') === 'true') {
            loader.style.display = 'none';
            login.classList.remove('oculto');
        } else {
            // Pantalla de carga rápida: 1.2 segundos
            setTimeout(() => {
                loader.style.display = 'none';
                login.classList.remove('oculto');
            }, 800);
        }
    }
});

// --- Lógica de Registro ---
const btnRegistrar = document.getElementById('btn-registrar');
if (btnRegistrar) {
    btnRegistrar.addEventListener('click', async () => {
        const nombre = document.getElementById('reg-nombre').value.trim();
        const apellidos = document.getElementById('reg-apellidos').value.trim();
        const fecha = document.getElementById('reg-fecha').value;
        const id = document.getElementById('reg-id').value.trim();

        if (!nombre || !id || !apellidos || !fecha) {
            return mostrarAviso("Por favor, rellena todos los campos antes de continuar.");
        }

        try {
            // Comprobar disponibilidad de Nombre + ID primero
            const q = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("identificador", "==", id));
            const consulta = await getDocs(q);
            
            if (!consulta.empty) {
                mostrarAviso("Ese Identificador ya está siendo usado por otra persona con el nombre '" + nombre + "'. Por favor, cambia tu Identificador.");
            } else {
                // Almacenar temporalmente los datos y pedir confirmación visual
                datosTemporalesRegistro = { nombre, apellidos, fecha, identificador: id };
                
                const mensajeConfirmacion = `
                    <strong>Compruebe que sus datos son correctos:</strong><br><br>
                    • <b>Nombre:</b> ${nombre}<br>
                    • <b>Apellidos:</b> ${apellidos}<br>
                    • <b>Identificador:</b> ${id}
                `;
                mostrarAviso(mensajeConfirmacion, false, true);
            }
        } catch (e) { 
            mostrarAviso("Error al conectar con el sistema."); 
        }
    });
}

// --- Lógica de Login ---
const btnIniciar = document.getElementById('btn-iniciar');
if (btnIniciar) {
    btnIniciar.addEventListener('click', async () => {
        const nombre = document.getElementById('login-nombre').value.trim();
        const id = document.getElementById('login-id').value.trim();
        
        if (!nombre || !id) return mostrarAviso("Introduce tu nombre y tu Identificador.");
        
        try {
            const q = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("identificador", "==", id));
            const consulta = await getDocs(q);
            if (consulta.empty) {
                mostrarAviso("No encontramos ninguna cuenta con esos datos. Revisa si están bien escritos.");
            } else {
                mostrarAviso("¡Bienvenido/a de nuevo, " + nombre + "!");
            }
        } catch (e) { mostrarAviso("Error al verificar la cuenta."); }
    });
}
