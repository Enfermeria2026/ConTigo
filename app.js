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

// --- Lógica de Modales ---
const modal = document.getElementById('modal-aviso');
const textoModal = document.getElementById('texto-modal');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
let redireccionarAlCerrar = false;

function mostrarAviso(mensaje, redirigir = false) {
    textoModal.innerText = mensaje;
    redireccionarAlCerrar = redirigir;
    modal.classList.remove('oculto');
}

if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', () => {
        modal.classList.add('oculto');
        if (redireccionarAlCerrar) window.location.href = 'index.html';
    });
}

// --- Lógica de Carga ---
window.addEventListener('load', () => {
    const loader = document.getElementById('pantalla-carga');
    const login = document.getElementById('pantalla-login');
    if (loader && login) {
        // Se muestran los puntos y la animación durante 3 segundos
        setTimeout(() => {
            loader.classList.add('oculto');
            login.classList.remove('oculto');
        }, 3000);
    }
});

// --- Lógica de Registro ---
const btnRegistrar = document.getElementById('btn-registrar');
if (btnRegistrar) {
    btnRegistrar.addEventListener('click', async () => {
        const nombre = document.getElementById('reg-nombre').value.trim();
        const id = document.getElementById('reg-id').value.trim();
        const apellidos = document.getElementById('reg-apellidos').value.trim();
        const fecha = document.getElementById('reg-fecha').value;

        if (!nombre || !id || !apellidos || !fecha) {
            return mostrarAviso("Rellena todos los campos.");
        }

        try {
            const q = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("identificador", "==", id));
            const consulta = await getDocs(q);
            if (!consulta.empty) {
                mostrarAviso("Ya existe ese usuario con ese ID. Prueba otro Identificador.");
            } else {
                await addDoc(collection(db, "usuarios"), { nombre, apellidos, fecha, identificador: id });
                mostrarAviso("¡Registro completado con éxito!", true);
            }
        } catch (e) { 
            mostrarAviso("Error al conectar con la base de datos."); 
            console.error(e);
        }
    });
}

// --- Lógica de Login ---
const btnIniciar = document.getElementById('btn-iniciar');
if (btnIniciar) {
    btnIniciar.addEventListener('click', async () => {
        const nombre = document.getElementById('login-nombre').value.trim();
        const id = document.getElementById('login-id').value.trim();
        
        if (!nombre || !id) {
            return mostrarAviso("Introduce tu nombre y tu Identificador.");
        }
        
        try {
            const q = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("identificador", "==", id));
            const consulta = await getDocs(q);
            if (consulta.empty) {
                mostrarAviso("No encontramos ninguna cuenta con esos datos.");
            } else {
                mostrarAviso("¡Bienvenido/a, " + nombre + "!");
            }
        } catch (e) { 
            mostrarAviso("Error de conexión."); 
            console.error(e);
        }
    });
}
