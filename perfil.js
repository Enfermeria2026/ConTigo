// perfil.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Configuración de tu Firebase (La misma de siempre)
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

// 2. Base de Datos local de Comunidades y Provincias (Con códigos oficiales)
const datosEspana = {
    "Andalucía": [{nombre: "Almería", id: "04"}, {nombre: "Cádiz", id: "11"}, {nombre: "Córdoba", id: "14"}, {nombre: "Granada", id: "18"}, {nombre: "Huelva", id: "21"}, {nombre: "Jaén", id: "23"}, {nombre: "Málaga", id: "29"}, {nombre: "Sevilla", id: "41"}],
    "Aragón": [{nombre: "Huesca", id: "22"}, {nombre: "Teruel", id: "44"}, {nombre: "Zaragoza", id: "50"}],
    "Asturias": [{nombre: "Asturias", id: "33"}],
    "Baleares": [{nombre: "Baleares", id: "07"}],
    "Canarias": [{nombre: "Las Palmas", id: "35"}, {nombre: "Santa Cruz de Tenerife", id: "38"}],
    "Cantabria": [{nombre: "Cantabria", id: "39"}],
    "Castilla y León": [{nombre: "Ávila", id: "05"}, {nombre: "Burgos", id: "09"}, {nombre: "León", id: "24"}, {nombre: "Palencia", id: "34"}, {nombre: "Salamanca", id: "37"}, {nombre: "Segovia", id: "40"}, {nombre: "Soria", id: "42"}, {nombre: "Valladolid", id: "47"}, {nombre: "Zamora", id: "49"}],
    "Castilla-La Mancha": [{nombre: "Albacete", id: "02"}, {nombre: "Ciudad Real", id: "13"}, {nombre: "Cuenca", id: "16"}, {nombre: "Guadalajara", id: "19"}, {nombre: "Toledo", id: "45"}],
    "Cataluña": [{nombre: "Barcelona", id: "08"}, {nombre: "Girona", id: "17"}, {nombre: "Lleida", id: "25"}, {nombre: "Tarragona", id: "43"}],
    "Comunidad Valenciana": [{nombre: "Alicante", id: "03"}, {nombre: "Castellón", id: "12"}, {nombre: "Valencia", id: "46"}],
    "Extremadura": [{nombre: "Badajoz", id: "06"}, {nombre: "Cáceres", id: "10"}],
    "Galicia": [{nombre: "A Coruña", id: "15"}, {nombre: "Lugo", id: "27"}, {nombre: "Ourense", id: "32"}, {nombre: "Pontevedra", id: "36"}],
    "Madrid": [{nombre: "Madrid", id: "28"}],
    "Murcia": [{nombre: "Murcia", id: "30"}],
    "Navarra": [{nombre: "Navarra", id: "31"}],
    "País Vasco": [{nombre: "Álava", id: "01"}, {nombre: "Bizkaia", id: "48"}, {nombre: "Gipuzkoa", id: "20"}],
    "La Rioja": [{nombre: "La Rioja", id: "26"}],
    "Ceuta": [{nombre: "Ceuta", id: "51"}],
    "Melilla": [{nombre: "Melilla", id: "52"}]
};

document.addEventListener('DOMContentLoaded', () => {
    // 3. Comprobar que el usuario ha iniciado sesión
    const usuarioString = localStorage.getItem('usuarioContigo');
    if (!usuarioString) {
        window.location.href = 'index.html';
        return;
    }
    const usuario = JSON.parse(usuarioString);
    let arbolFamiliar = usuario.arbol_genealogico || [];

    // 4. Rellenar los datos por defecto (Bloqueados)
    document.getElementById('perfil-nombre').value = usuario.nombre || '';
    document.getElementById('perfil-apellidos').value = usuario.apellidos || '';
    document.getElementById('perfil-fecha').value = usuario.fecha_nacimiento || usuario.fecha || '';
    
    // Rellenar datos opcionales si ya los tenía guardados de antes
    if (usuario.color_favorito) document.getElementById('perfil-color').value = usuario.color_favorito;
    if (usuario.descripcion) document.getElementById('perfil-descripcion').value = usuario.descripcion;

    // 5. Lógica de Desplegables de Ubicación (CCAA -> Provincia -> Localidad)
    const selectCcaa = document.getElementById('select-ccaa');
    const selectProvincia = document.getElementById('select-provincia');
    const selectLocalidad = document.getElementById('select-localidad');

    // Llenar CCAA
    Object.keys(datosEspana).forEach(ccaa => {
        const opcion = document.createElement('option');
        opcion.value = ccaa;
        opcion.innerText = ccaa;
        selectCcaa.appendChild(opcion);
    });

    // Cuando cambias de CCAA...
    selectCcaa.addEventListener('change', () => {
        selectProvincia.innerHTML = '<option value="">Selecciona Provincia...</option>';
        selectLocalidad.innerHTML = '<option value="">Primero elige una Provincia...</option>';
        selectLocalidad.disabled = true;

        if (selectCcaa.value !== "") {
            selectProvincia.disabled = false;
            datosEspana[selectCcaa.value].forEach(prov => {
                const opcion = document.createElement('option');
                opcion.value = prov.nombre;
                opcion.dataset.id = prov.id; // Guardamos el código secreto para la API
                opcion.innerText = prov.nombre;
                selectProvincia.appendChild(opcion);
            });
        } else {
            selectProvincia.disabled = true;
        }
    });

   // Cuando cambias de Provincia... (AHORA CON PUENTE SEGURO)
    selectProvincia.addEventListener('change', async () => {
        selectLocalidad.innerHTML = '<option value="">Cargando pueblos...</option>';
        
        if (selectProvincia.value !== "") {
            const opcionElegida = selectProvincia.options[selectProvincia.selectedIndex];
            const idProvincia = opcionElegida.dataset.id;
            
            try {
                // 1. Preparamos la dirección de la base de datos oficial
                const urlOficial = encodeURIComponent(`https://www.el-tiempo.net/api/json/v2/provincias/${idProvincia}/municipios`);
                
                // 2. Usamos el Puente Seguro (AllOrigins) para evitar el bloqueo del navegador
                const respuesta = await fetch(`https://api.allorigins.win/get?url=${urlOficial}`);
                const datosPuente = await respuesta.json();
                
                // 3. Traducimos lo que nos ha traído el puente
                const datosReales = JSON.parse(datosPuente.contents);
                
                selectLocalidad.innerHTML = '<option value="">Selecciona tu localidad...</option>';
                
                // 4. Llenamos el desplegable
                if (datosReales.municipios) {
                    datosReales.municipios.forEach(muni => {
                        const opcion = document.createElement('option');
                        opcion.value = muni.NOMBRE;
                        opcion.innerText = muni.NOMBRE;
                        selectLocalidad.appendChild(opcion);
                    });
                    selectLocalidad.disabled = false;
                } else {
                    selectLocalidad.innerHTML = '<option value="">Error al cargar los pueblos</option>';
                    selectLocalidad.disabled = true;
                }
                
            } catch (error) {
                // Si aún así falla (por ejemplo, si te quedas sin WiFi)
                selectLocalidad.innerHTML = '<option value="">Error de conexión. Reintenta.</option>';
                selectLocalidad.disabled = true;
            }
        } else {
            selectLocalidad.disabled = true;
            selectLocalidad.innerHTML = '<option value="">Primero elige una Provincia...</option>';
        }
    });

    // 6. Lógica del Árbol Genealógico
    const btnAddFamiliar = document.getElementById('btn-añadir-familiar');
    const inputFamiliarNombre = document.getElementById('input-familiar-nombre');
    const selectFamiliarVinculo = document.getElementById('select-familiar-vinculo');
    const contenedorArbol = document.getElementById('contenedor-arbol');

    function dibujarArbol() {
        contenedorArbol.innerHTML = '';
        if (arbolFamiliar.length === 0) {
            contenedorArbol.innerHTML = '<p style="color:#7F8C8D; text-align:center;">Aún no has añadido a nadie.</p>';
            return;
        }
        
        arbolFamiliar.forEach((familiar, index) => {
            const tarjeta = document.createElement('div');
            tarjeta.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:white; padding:12px 15px; border-radius:12px; border:1px solid #E5E8E8; font-size:1.1rem;";
            
            tarjeta.innerHTML = `
                <div><strong>${familiar.nombre}</strong> <span style="color:#7F8C8D;">(${familiar.vinculo})</span></div>
                <button class="btn-borrar-familiar" data-index="${index}" style="background:none; border:none; color:red; font-size:1.2rem; cursor:pointer;">❌</button>
            `;
            contenedorArbol.appendChild(tarjeta);
        });

        // Dar vida a los botones de borrar
        document.querySelectorAll('.btn-borrar-familiar').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const indice = e.target.dataset.index;
                arbolFamiliar.splice(indice, 1); // Lo borramos de la lista
                dibujarArbol(); // Redibujamos
            });
        });
    }
    
    // Dibujar el árbol al cargar la pantalla
    dibujarArbol();

    // Añadir nuevo familiar
    btnAddFamiliar.addEventListener('click', () => {
        const nombreF = inputFamiliarNombre.value.trim();
        const vinculoF = selectFamiliarVinculo.value;

        if (!nombreF || !vinculoF) {
            mostrarAviso("Por favor, escribe el nombre y selecciona el vínculo.");
            return;
        }

        arbolFamiliar.push({ nombre: nombreF, vinculo: vinculoF });
        inputFamiliarNombre.value = '';
        selectFamiliarVinculo.value = '';
        dibujarArbol();
    });

    // 7. GUARDAR DATOS EN FIREBASE
    const btnGuardar = document.getElementById('btn-guardar-perfil');
    btnGuardar.addEventListener('click', async () => {
        const ccaa = selectCcaa.value;
        const provincia = selectProvincia.value;
        const localidadElement = document.getElementById('select-localidad');
        const localidad = localidadElement ? localidadElement.value : '';

        // Validar obligatorios
        if (!ccaa || !provincia || !localidad) {
            mostrarAviso("⚠️ Por favor, rellena tu Comunidad Autónoma, Provincia y Localidad. Son necesarios para los servicios de emergencia y farmacias.");
            return;
        }

        // Cambiamos el texto del botón para que sepa que está cargando
        btnGuardar.innerText = "⏳ Guardando...";
        btnGuardar.disabled = true;

        const color = document.getElementById('perfil-color').value.trim();
        const descripcion = document.getElementById('perfil-descripcion').value.trim();

        try {
            // Buscamos al usuario en la base de datos
            const q = query(collection(db, "usuarios"), 
                where("nombre_normalizado", "==", usuario.nombre_normalizado), 
                where("identificador_normalizado", "==", usuario.identificador_normalizado)
            );
            const consulta = await getDocs(q);

            if (!consulta.empty) {
                const documentoUsuario = consulta.docs[0];
                
                // Actualizamos Firebase
                await updateDoc(documentoUsuario.ref, {
                    ccaa: ccaa,
                    provincia: provincia,
                    localidad: localidad,
                    color_favorito: color,
                    descripcion: descripcion,
                    arbol_genealogico: arbolFamiliar
                });

                // Actualizamos la memoria del móvil
                usuario.ccaa = ccaa;
                usuario.provincia = provincia;
                usuario.localidad = localidad;
                usuario.color_favorito = color;
                usuario.descripcion = descripcion;
                usuario.arbol_genealogico = arbolFamiliar;
                localStorage.setItem('usuarioContigo', JSON.stringify(usuario));

                mostrarAviso("✅ ¡Perfil actualizado correctamente!");
            }
        } catch (error) {
            mostrarAviso("❌ Hubo un error al guardar. Revisa tu conexión a internet.");
        } finally {
            // Restauramos el botón
            btnGuardar.innerText = "💾 Guardar Cambios";
            btnGuardar.disabled = false;
        }
    });

    // 8. Botón Volver
    const btnVolver = document.getElementById('btn-volver');
    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            window.location.href = 'menu.html';
        });
    }
});

// --- 9. SISTEMA DE AVISOS PERSONALIZADO ---
    const modalAviso = document.getElementById('modal-aviso-perfil');
    const tituloAviso = document.getElementById('titulo-aviso');
    const textoAviso = document.getElementById('texto-aviso');
    const btnCerrarAviso = document.getElementById('btn-cerrar-aviso');

    function mostrarAviso(mensaje, titulo = "Aviso") {
        if (tituloAviso) tituloAviso.innerText = titulo;
        if (textoAviso) textoAviso.innerHTML = mensaje;
        if (modalAviso) modalAviso.classList.remove('oculto');
    }

    if (btnCerrarAviso) {
        btnCerrarAviso.addEventListener('click', () => {
            modalAviso.classList.add('oculto');
        });
    }
