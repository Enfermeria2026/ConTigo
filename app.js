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

// Lógica de Modales
const modal = document.getElementById('modal-aviso');
const textoModal = document.getElementById('texto-modal');
let redireccionar = false;
document.getElementById('btn-cerrar-modal')?.addEventListener('click', () => {
  modal.classList.add('oculto');
  if (redireccionar) window.location.href = 'index.html';
});

function mostrarAviso(msg, redir = false) {
  textoModal.innerText = msg;
  redireccionar = redir;
  modal.classList.remove('oculto');
}

// Carga Inicial
if (document.getElementById('pantalla-carga')) {
  setTimeout(() => {
    document.getElementById('pantalla-carga').classList.add('oculto');
    document.getElementById('pantalla-login').classList.remove('oculto');
  }, 2000);
}

// Registro
document.getElementById('btn-registrar')?.addEventListener('click', async () => {
  const nombre = document.getElementById('reg-nombre').value;
  const id = document.getElementById('reg-id').value;
  const q = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("identificador", "==", id));
  if (!(await getDocs(q)).empty) return mostrarAviso("Ese ID ya existe para este nombre.");
  await addDoc(collection(db, "usuarios"), { nombre, apellidos: document.getElementById('reg-apellidos').value, identificador: id });
  mostrarAviso("Registro completado.", true);
});

// Login
document.getElementById('btn-iniciar')?.addEventListener('click', async () => {
  const nombre = document.getElementById('login-nombre').value;
  const id = document.getElementById('login-id').value;
  const q = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("identificador", "==", id));
  if ((await getDocs(q)).empty) return mostrarAviso("Datos incorrectos.");
  alert("¡Bienvenido!");
});
