// 1. IMPORTACIONES DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. CONFIGURACIÓN
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

// 3. LÓGICA DE MODALES (Avisos)
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
        if (redireccionarAlCerrar) {
            window.location.href = 'index.html';
        }
    });
}

// 4. LÓGICA DE PANTALLA DE CARGA
window.addEventListener('load', () => {
    const loader = document.getElementById('pantalla-carga');
    const login = document.getElementById('pantalla-login');
    
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.classList.add('oculto');
                if (login) login.classList.remove('oculto');
            }, 500);
        }, 2500); // 2.5 segundos de carga
    }
});

// 5. LÓGICA DE REGISTRO
const btnRegistrar = document.getElementById('btn-registrar');
if (btnRegistrar) {
    btnRegistrar.addEventListener('click', async () => {
        const nombre = document.getElementById('reg-nombre').value.trim();
        const apellidos = document.getElementById('reg-apellidos').value.trim();
        const fecha = document.getElementById('reg-fecha').value;
        const id = document.getElementById('reg-id').value.trim();

        if (!nombre || !apellidos || !fecha || !id) {
            return mostrarAviso("Por favor, rellena todos los campos.");
        }

        try {
            // Verificar si el usuario con ese Nombre y ese ID ya existe
            const q = query(collection(db, "usuarios"), 
                where("nombre", "==", nombre), 
                where("identificador", "==", id));
            
            const consulta = await getDocs(q);

            if (!consulta.empty) {
                mostrarAviso("Ya existe un usuario con ese nombre e identificador. Por favor, elige otro ID.");
            } else {
                await addDoc(collection(db, "usuarios"), {
                    nombre: nombre,
                    apellidos: apellidos,
                    fecha_nacimiento: fecha,
                    identificador: id
                });
                mostrarAviso("¡Registro completado con éxito!", true);
            }
        } catch (error) {
            mostrarAviso("Hubo un error de conexión, intenta de nuevo.");
        }
    });
}

// 6. LÓGICA DE INICIO DE SESIÓN
const btnIniciar = document.getElementById('btn-iniciar');
if (btnIniciar) {
    btnIniciar.addEventListener('click', async () => {
        const nombre = document.getElementById('login-nombre').value.trim();
        const id = document.getElementById('login-id').value.trim();

        if (!nombre || !id) {
            return mostrarAviso("Introduce tu nombre e identificador.");
        }

        try {
            const q = query(collection(db, "usuarios"), 
                where("nombre", "==", nombre), 
                where("identificador", "==", id));
            
            const consulta = await getDocs(q);

            if (consulta.empty) {
                mostrarAviso("No encontramos ese nombre o ese identificador. Revisa los datos.");
            } else {
                // Éxito: Aquí redirigiremos al menú principal en la siguiente fase
                mostrarAviso("¡Bienvenido, " + nombre + "!");
            }
        } catch (error) {
            mostrarAviso("Error de conexión.");
        }
    });
}
