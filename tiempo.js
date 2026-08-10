// tiempo.js - VERSIÓN OFICIAL AEMET (100% FIABLE)

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SEGURIDAD: BOTONES Y TUTORIAL ---
    const btnVolver = document.getElementById('btn-volver-tiempo');
    const btnCambiar = document.getElementById('btn-cambiar-semana');
    const modalScroll = document.getElementById('modal-scroll-tiempo');
    const btnEntendidoScroll = document.getElementById('btn-entendido-scroll');

    // Botón de Volver protegido
    if (btnVolver) {
        btnVolver.onclick = () => window.location.href = 'menu.html';
    }

    // Botón de cambiar días
    if (btnCambiar) {
        btnCambiar.onclick = () => toggleSemana();
    }

    // Lógica del Tutorial de Scroll (Deslizar)
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

    let viendoProxima = false;
    let datosAemetGlobal = null; // Guardamos los datos para no descargar dos veces

    function toggleSemana() {
        viendoProxima = !viendoProxima;
        pintarTarjetas(viendoProxima);
    }

    async function cargarDatosAemet() {
        const contenedor = document.getElementById('contenedor-dias');
        if(contenedor) contenedor.innerHTML = "<div style='padding:20px; text-align:center; font-weight:bold; color:#2C3E50;'>Conectando con AEMET oficial... ⏳</div>";

        try {
            // A. Buscamos el código INE de la localidad en la base abierta de el-tiempo (rápida y sin bloqueos)
            const normalizar = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const localidadBuscada = normalizar(usuario.localidad);

            const resMuni = await fetch('https://www.el-tiempo.net/api/json/v2/municipios');
            const listaMunicipios = await resMuni.json();
            const municipioEncontrado = listaMunicipios.find(m => normalizar(m.NOMBRE) === localidadBuscada);

            if (!municipioEncontrado) throw new Error("Localidad no encontrada");

            // Extraemos los 5 primeros dígitos (El Código oficial que usa AEMET)
            const codigoMun = municipioEncontrado.CODIGOINE.substring(0, 5);

            // B. Pedimos la URL de los datos usando TU CLAVE DE AEMET
            const AEMET_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXJvbGluYXJ0aWVkYTExQGdtYWlsLmNvbSIsImp0aSI6ImE2ZmYxNThmLWRjY2MtNGIzYy1hOTYyLTZhMzU4MTE3NTRmZiIsImV4cCI6MTc5NDk2NDU0MiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3ODYzMjQ1NDIsInVzZXJJZCI6ImE2ZmYxNThmLWRjY2MtNGIzYy1hOTYyLTZhMzU4MTE3NTRmZiIsInJvbGUiOiIifQ.AaOcuSulR2l_VrjKDv8CM-ArqKKgu3PJtH_fQVF5yAw";
            const resPred = await fetch(`https://opendata.aemet.es/opendata/api/prediccion/especifica/municipios/diaria/${codigoMun}?api_key=${AEMET_KEY}`);
            const dataPred = await resPred.json();

            // C. ¡EL TRUCO DE SEGURIDAD! Usamos un "corsproxy" para descargar el archivo y evitar el bloqueo de AEMET
            const resDatos = await fetch(`https://corsproxy.io/?${encodeURIComponent(dataPred.datos)}`);
            const jsonAemet = await resDatos.json();

            // Guardamos los 7 días de predicción
            datosAemetGlobal = jsonAemet[0].prediccion.dia;
            pintarTarjetas(false);

        } catch(e) {
            if(contenedor) contenedor.innerHTML = "<div style='padding:20px; text-align:center; font-weight:bold; color:#E74C3C;'>Error al conectar con AEMET. Revisa que el nombre de tu localidad esté bien escrito en Mi Perfil.</div>";
        }
    }

    function pintarTarjetas(proxima) {
        if (!datosAemetGlobal) return;

        const contenedor = document.getElementById('contenedor-dias');
        const estadoTxt = document.getElementById('texto-estado-semana');
        
        // AEMET solo da 7 días, así que dividimos los textos para los primeros 4 días y los 3 últimos
        if(estadoTxt) estadoTxt.innerText = proxima ? "Previsión de los siguientes días" : "Previsión de los primeros días";
        const btnCambiar = document.getElementById('btn-cambiar-semana');
        if(btnCambiar) btnCambiar.innerText = proxima ? "Ver primeros días" : "Ver siguientes días";

        contenedor.innerHTML = "";

        // Si es proxima, del día 4 al 6 (o final). Si no, del 0 al 3.
        const start = proxima ? 4 : 0;
        const end = proxima ? datosAemetGlobal.length : 4;

        for (let i = start; i < end; i++) {
            const diaAemet = datosAemetGlobal[i];

            // 1. Fechas y nombres (DD/MM)
            const fechaObjeto = new Date(diaAemet.fecha);
            let nombreDia = fechaObjeto.toLocaleDateString('es-ES', {weekday: 'long'});
            nombreDia = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);
            const diaNum = String(fechaObjeto.getDate()).padStart(2, '0');
            const mesNum = String(fechaObjeto.getMonth() + 1).padStart(2, '0');
            const fechaFormateada = `${diaNum}/${mesNum}`;

            // 2. Temperaturas (AEMET)
            const max = diaAemet.temperatura.maxima;
            const min = diaAemet.temperatura.minima;

            // 3. Viento (AEMET - calculamos el pico máximo del día)
            let viento = 0;
            if (diaAemet.viento && diaAemet.viento.length > 0) {
                viento = Math.max(...diaAemet.viento.map(v => parseInt(v.velocidad || 0)));
            }

            // 4. Estado del Cielo (AEMET)
            let estadoCielo = "11"; 
            if (diaAemet.estadoCielo && diaAemet.estadoCielo.length > 0) {
                // Buscamos la primera predicción que no esté vacía
                const cieloValido = diaAemet.estadoCielo.find(c => c.value !== "");
                if(cieloValido) estadoCielo = cieloValido.value;
            }

            // Limpiamos las letras que pone AEMET (como la 'n' de noche) para quedarnos con el código exacto
            const cod = estadoCielo.replace(/[a-zA-Z]/g, '');

            let icono = "☀️"; // Despejado por defecto
            if (["12", "13", "14", "15", "16", "17"].includes(cod)) icono = "⛅"; // Nubes
            else if (["23", "24", "25", "26", "43", "44", "45", "46", "61", "62", "63", "64"].includes(cod)) icono = "🌧️"; // Lluvias reales
            else if (["51", "52", "53", "54"].includes(cod)) icono = "⛈️"; // Tormenta
            else if (["71", "72", "73", "74", "33", "34", "35", "36"].includes(cod)) icono = "❄️"; // Nieve

            // 5. Olas de Viento (Tus reglas: <19, 20-38, 39+)
            let rayas = "〰️";
            if (viento >= 20 && viento <= 38) rayas = "〰️<br>〰️";
            else if (viento >= 39) rayas = "〰️<br>〰️<br>〰️";

            // 6. Construcción visual de la tarjeta
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

    // Arrancamos la descarga al entrar a la pantalla
    cargarDatosAemet();
});
