// tiempo.js - VERSIÓN DEFINITIVA (Datos completos + Filtro Cartagena)

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SEGURIDAD: BOTONES Y TUTORIAL ---
    const btnVolver = document.getElementById('btn-volver-tiempo');
    const modalScroll = document.getElementById('modal-scroll-tiempo');
    const btnEntendidoScroll = document.getElementById('btn-entendido-scroll');

    // Botón de Volver protegido
    if (btnVolver) {
        btnVolver.onclick = () => window.location.href = 'menu.html';
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

    // --- 2. LÓGICA DE DATOS Y FILTRO INTELIGENTE ---
    const usuarioRecuperado = localStorage.getItem('usuarioContigo');
    if (!usuarioRecuperado) { window.location.href = 'index.html'; return; }
    const usuario = JSON.parse(usuarioRecuperado);
    
    const elUbicacion = document.getElementById('titulo-localidad');
    if(elUbicacion) elUbicacion.innerText = usuario.localidad || "Sin localidad";

    async function cargarDatos() {
        const contenedor = document.getElementById('contenedor-dias');
        if(contenedor) contenedor.innerHTML = "<div style='padding:20px; text-align:center; font-weight:bold; color:#2C3E50;'>Cargando previsión... ⏳</div>";

        // Ocultamos el botón naranja porque usamos scroll
        const btnCambiar = document.getElementById('btn-cambiar-semana');
        if(btnCambiar) btnCambiar.style.display = 'none';

        const estadoTxt = document.getElementById('texto-estado-semana');
        if(estadoTxt) estadoTxt.innerText = "Previsión de los próximos 7 días";

        try {
            // A. Buscamos coordenadas 
            const resGeo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(usuario.localidad)}&count=1&language=es`);
            const geo = await resGeo.json();
            
            if (!geo.results || geo.results.length === 0) {
                throw new Error("Localidad no encontrada");
            }
            const { latitude, longitude } = geo.results[0];

            // B. Petición ESTÁNDAR (Garantiza que lleguen temperaturas y viento) + Probabilidad de lluvia
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,precipitation_probability_max&timezone=Europe/Madrid`);
            const data = await res.json();

            contenedor.innerHTML = "";
            
            // Pintamos los primeros 7 días
            for (let i = 0; i < 7; i++) {
                const max = Math.round(data.daily.temperature_2m_max[i]);
                const min = Math.round(data.daily.temperature_2m_min[i]);
                const viento = Math.round(data.daily.windspeed_10m_max[i]);
                const probabilidadLluvia = data.daily.precipitation_probability_max[i] || 0;
                let codigo = data.daily.weathercode[i];

                // --- EL FILTRO "CARTAGENA" (Nuestra corrección inteligente) ---
                // Si la máquina dice que llueve (código >= 50) pero la probabilidad real es menor al 30%...
                // ...corregimos a la máquina y forzamos el icono de "Nublado" (código 3).
                if (codigo >= 50 && probabilidadLluvia < 30) {
                    codigo = 3; 
                }

                // Selección de Iconos
                let icono = "☀️";
                if (codigo === 1 || codigo === 2) icono = "⛅"; 
                else if (codigo === 3) icono = "☁️"; 
                else if (codigo >= 45 && codigo <= 48) icono = "🌫️"; 
                else if (codigo >= 51 && codigo <= 67) icono = "🌧️"; 
                else if (codigo >= 71 && codigo <= 77) icono = "❄️"; 
                else if (codigo >= 80 && codigo <= 82) icono = "🌧️"; 
                else if (codigo >= 95) icono = "⛈️"; 

                // Olas de viento (Tus reglas)
                let rayas = "〰️";
                if (viento >= 20 && viento <= 38) rayas = "〰️<br>〰️";
                else if (viento >= 39) rayas = "〰️<br>〰️<br>〰️";

                // Fechas (DD/MM)
                const fechaObjeto = new Date(data.daily.time[i]);
                let nombreDia = fechaObjeto.toLocaleDateString('es-ES', {weekday: 'long'});
                nombreDia = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);
                const diaNum = String(fechaObjeto.getDate()).padStart(2, '0');
                const mesNum = String(fechaObjeto.getMonth() + 1).padStart(2, '0');
                const fechaFormateada = `${diaNum}/${mesNum}`;

                // Construcción de la tarjeta
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

        } catch(e) {
            if(contenedor) contenedor.innerHTML = `<div style='padding:20px; text-align:center; font-weight:bold; color:#E74C3C;'>No se ha podido cargar la previsión. Comprueba tu conexión.</div>`;
        }
    }

    cargarDatos();
});
