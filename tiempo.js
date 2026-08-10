// tiempo.js - Versión separada para asegurar que los botones siempre respondan

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. SEGURIDAD: BOTONES (Configurados lo primero, pase lo que pase) ---
    const btnVolver = document.getElementById('btn-volver-tiempo');
    const btnCambiar = document.getElementById('btn-cambiar-semana');

    if (btnVolver) {
        btnVolver.onclick = () => {
            window.location.href = 'menu.html';
        };
    }

    if (btnCambiar) {
        btnCambiar.onclick = () => {
            toggleSemana();
        };
    }

    // --- 2. LÓGICA DE DATOS ---
    const usuarioRecuperado = localStorage.getItem('usuarioContigo');
    if (!usuarioRecuperado) { window.location.href = 'index.html'; return; }
    const usuario = JSON.parse(usuarioRecuperado);
    document.getElementById('titulo-localidad').innerText = usuario.localidad || "Sin localidad";

    let viendoProxima = false;

    function toggleSemana() {
        viendoProxima = !viendoProxima;
        cargarDatos(viendoProxima);
    }

    async function cargarDatos(proxima) {
        const contenedor = document.getElementById('contenedor-dias');
        const estadoTxt = document.getElementById('texto-estado-semana');
        
        contenedor.innerHTML = "Cargando...";
        estadoTxt.innerText = proxima ? "Estás viendo la previsión de la semana que viene" : "Estas viendo la previsión para esta semana";
        btnCambiar.innerText = proxima ? "Ver esta semana" : "Ver siguiente semana";

        try {
            // Buscamos coordenadas (Open-Meteo)
            const resGeo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(usuario.localidad)}&count=1&language=es`);
            const geo = await resGeo.json();
            const { latitude, longitude } = geo.results[0];

            // Pedimos el tiempo
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=Europe/Madrid&forecast_days=14`);
            const data = await res.json();

            contenedor.innerHTML = "";
            const start = proxima ? 7 : 0;
            
            for (let i = start; i < start + 7; i++) {
                const max = Math.round(data.daily.temperature_2m_max[i]);
                const min = Math.round(data.daily.temperature_2m_min[i]);
                const viento = Math.round(data.daily.windspeed_10m_max[i]);
                const codigo = data.daily.weathercode[i];

                let icono = (codigo >= 95) ? "⛈️" : (codigo >= 51) ? "🌧️" : (codigo >= 45) ? "🌫️" : (codigo >= 1 && codigo <= 3) ? "⛅" : "☀️";
                
                let rayas = "〰️";
                if (viento >= 20 && viento <= 38) rayas = "〰️<br>〰️";
                else if (viento >= 39) rayas = "〰️<br>〰️<br>〰️";

                const dia = document.createElement('div');
                dia.className = 'tarjeta-dia';
                dia.innerHTML = `
                    <div class="card-dia">${new Date(data.daily.time[i]).toLocaleDateString('es-ES', {weekday: 'long'}).charAt(0).toUpperCase() + new Date(data.daily.time[i]).toLocaleDateString('es-ES', {weekday: 'long'}).slice(1)}</div>
                    <div class="card-icono">${icono}</div>
                    <div class="card-viento">${rayas}<br>${viento} km/h</div>
                    <div class="card-temps">
                        <span class="temp-max">max: ${max}ºC</span>
                        <span class="temp-min">min: ${min}ºC</span>
                    </div>
                `;
                contenedor.appendChild(dia);
            }
        } catch(e) {
            contenedor.innerHTML = "Error al conectar. Verifica tu conexión.";
        }
    }

    // Arrancamos
    cargarDatos(false);
});
