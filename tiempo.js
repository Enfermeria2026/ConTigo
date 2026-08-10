// tiempo.js - VERSIÓN OFICIAL AEMET (Con puente anti-bloqueos CORS)

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SEGURIDAD: BOTONES Y TUTORIAL ---
    const btnVolver = document.getElementById('btn-volver-tiempo');
    const modalScroll = document.getElementById('modal-scroll-tiempo');
    const btnEntendidoScroll = document.getElementById('btn-entendido-scroll');

    if (btnVolver) {
        btnVolver.onclick = () => window.location.href = 'menu.html';
    }

    const avisoScrollVisto = localStorage.getItem('avisoTiempoScrollVisto');
    if (!avisoScrollVisto && modalScroll) {
        modalScroll.classList.remove('modal-oculto');
    }
    if (btnEntendidoScroll && modalScroll) {
        btnEntendidoScroll.onclick = () => {
            localStorage.setItem('avisoTiempoScrollVisto', 'true');
            modalScroll.classList.add('modal-oculto');
        };
    }

    // --- 2. LÓGICA DE DATOS OFICIALES (AEMET) ---
    const usuarioRecuperado = localStorage.getItem('usuarioContigo');
    if (!usuarioRecuperado) { window.location.href = 'index.html'; return; }
    const usuario = JSON.parse(usuarioRecuperado);
    
    const elUbicacion = document.getElementById('titulo-localidad');
    if(elUbicacion) elUbicacion.innerText = usuario.localidad || "Sin localidad";

    let datosAemetGlobal = null; 

    async function cargarDatosAemet() {
        const contenedor = document.getElementById('contenedor-dias');
        if(contenedor) contenedor.innerHTML = "<div style='padding:20px; text-align:center; font-weight:bold; color:#2C3E50;'>Conectando con AEMET oficial... ⏳</div>";

        const btnCambiar = document.getElementById('btn-cambiar-semana');
        if(btnCambiar) btnCambiar.style.display = 'none';

        const estadoTxt = document.getElementById('texto-estado-semana');
        if(estadoTxt) estadoTxt.innerText = "Cargando previsión...";

        try {
            // A. Buscamos el código INE de la localidad
            const normalizar = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const localidadBuscada = normalizar(usuario.localidad);

            const resMuni = await fetch('https://www.el-tiempo.net/api/json/v2/municipios');
            const listaMunicipios = await resMuni.json();
            
            const municipioEncontrado = listaMunicipios.find(m => normalizar(m.NOMBRE) === localidadBuscada || normalizar(m.NOMBRE).includes(localidadBuscada));

            if (!municipioEncontrado) {
                throw new Error("No encontramos el código de: " + usuario.localidad);
            }

            const codigoMun = municipioEncontrado.CODIGOINE.substring(0, 5);

            // B. Conexión a AEMET a través del puente AllOrigins para evitar el "Failed to fetch" (CORS)
            const AEMET_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXJvbGluYXJ0aWVkYTExQGdtYWlsLmNvbSIsImp0aSI6ImE2ZmYxNThmLWRjY2MtNGIzYy1hOTYyLTZhMzU4MTE3NTRmZiIsImV4cCI6MTc5NDk2NDU0MiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3ODYzMjQ1NDIsInVzZXJJZCI6ImE2ZmYxNThmLWRjY2MtNGIzYy1hOTYyLTZhMzU4MTE3NTRmZiIsInJvbGUiOiIifQ.AaOcuSulR2l_VrjKDv8CM-ArqKKgu3PJtH_fQVF5yAw";
            const urlAemet = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipios/diaria/${codigoMun}?api_key=${AEMET_KEY}`;
            
            // Usamos AllOrigins como puente
            const resPred = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(urlAemet)}`);
            const proxy1 = await resPred.json();
            const dataPred = JSON.parse(proxy1.contents); // Desempaquetamos los datos de AEMET

            // Filtros de errores de AEMET
            if (dataPred.estado === 401) throw new Error("Tu Clave de AEMET ha caducado.");
            if (dataPred.estado === 429) throw new Error("AEMET saturado. Espera un poco.");
            if (!dataPred.datos) throw new Error("AEMET no devuelve datos ahora.");

            // C. Descarga del archivo final también a través del puente AllOrigins
            const resDatos = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(dataPred.datos)}`);
            const proxy2 = await resDatos.json();
            const jsonAemet = JSON.parse(proxy2.contents);

            datosAemetGlobal = jsonAemet[0].prediccion.dia;
            pintarTarjetas();

        } catch(e) {
            // Si algo falla, lo mostramos claramente
            if(contenedor) contenedor.innerHTML = `<div style='padding:20px; text-align:center; font-weight:bold; color:#E74C3C;'>Error: ${e.message}</div>`;
        }
    }

    function pintarTarjetas() {
        if (!datosAemetGlobal) return;

        const contenedor = document.getElementById('contenedor-dias');
        const estadoTxt = document.getElementById('texto-estado-semana');
        if(estadoTxt) estadoTxt.innerText = "Previsión de los próximos 7 días";
        contenedor.innerHTML = "";

        for (let i = 0; i < datosAemetGlobal.length; i++) {
            const diaAemet = datosAemetGlobal[i];

            const fechaObjeto = new Date(diaAemet.fecha);
            let nombreDia = fechaObjeto.toLocaleDateString('es-ES', {weekday: 'long'});
            nombreDia = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);
            const diaNum = String(fechaObjeto.getDate()).padStart(2, '0');
            const mesNum = String(fechaObjeto.getMonth() + 1).padStart(2, '0');
            const fechaFormateada = `${diaNum}/${mesNum}`;

            const max = diaAemet.temperatura.maxima;
            const min = diaAemet.temperatura.minima;

            let viento = 0;
            if (diaAemet.viento && diaAemet.viento.length > 0) {
                viento = Math.max(...diaAemet.viento.map(v => parseInt(v.velocidad || 0)));
            }

            let estadoCielo = "11"; 
            if (diaAemet.estadoCielo && diaAemet.estadoCielo.length > 0) {
                const cieloValido = diaAemet.estadoCielo.find(c => c.value !== "");
                if(cieloValido) estadoCielo = cieloValido.value;
            }

            const cod = estadoCielo.replace(/[a-zA-Z]/g, '');

            let icono = "☀️"; 
            if (["12", "13", "14", "15", "16", "17"].includes(cod)) icono = "⛅"; 
            else if (["23", "24", "25", "26", "43", "44", "45", "46", "61", "62", "63", "64"].includes(cod)) icono = "🌧️"; 
            else if (["51", "52", "53", "54"].includes(cod)) icono = "⛈️"; 
            else if (["71", "72", "73", "74", "33", "34", "35", "36"].includes(cod)) icono = "❄️"; 

            let rayas = "〰️";
            if (viento >= 20 && viento <= 38) rayas = "〰️<br>〰️";
            else if (viento >= 39) rayas = "〰️<br>〰️<br>〰️";

            const diaDiv = document.createElement('div');
            diaDiv.className = 'tarjeta-dia';
            diaDiv.innerHTML = `
                <div class="card-dia">
                    <span>${nombreDia}</span>
                    <span class="card-fecha">${fechaFormateada}</span>
                </div>
                <div class="card-icono">${icono}</div>
                <div class="card-viento">${rayas}<br>${viento} km/h</div>
                <div class="card-temps">
                    <span class="temp-max">max: ${max}ºC</span>
                    <span class="temp-min">min: ${min}ºC</span>
                </div>
            `;
            contenedor.appendChild(diaDiv);
        }
    }

    cargarDatosAemet();
});
