document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('btn-volver-tiempo').onclick = () => window.location.href = 'menu.html';
    
    const usuario = JSON.parse(localStorage.getItem('usuarioContigo'));
    document.getElementById('titulo-localidad').innerText = usuario.localidad;

    let viendoProxima = false;
    document.getElementById('btn-cambiar-semana').onclick = () => {
        viendoProxima = !viendoProxima;
        cargarTiempo(viendoProxima);
    };

    async function cargarTiempo(proxima) {
        const contenedor = document.getElementById('contenedor-dias');
        contenedor.innerHTML = "Cargando...";
        
        try {
            const geo = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${usuario.localidad}&count=1`)).json();
            const { latitude, longitude } = geo.results[0];
            const data = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=Europe/Madrid&forecast_days=14`)).json();
            
            contenedor.innerHTML = "";
            const start = proxima ? 7 : 0;
            
            for (let i = start; i < start + 7; i++) {
                const max = Math.round(data.daily.temperature_2m_max[i]);
                const min = Math.round(data.daily.temperature_2m_min[i]);
                const viento = Math.round(data.daily.windspeed_10m_max[i]);
                const codigo = data.daily.weathercode[i];

                // Iconos
                let icono = "☀️";
                if (codigo >= 1 && codigo <= 3) icono = "⛅";
                else if (codigo >= 45 && codigo <= 48) icono = "🌫️";
                else if (codigo >= 51 && codigo <= 67) icono = "🌧️";
                else if (codigo >= 95) icono = "⛈️";

                // Viento apilado (una raya debajo de otra)
                let rayas = "〰️";
                if (viento > 15 && viento <= 30) rayas = "〰️<br>〰️";
                else if (viento > 30) rayas = "〰️<br>〰️<br>〰️";

                const dia = document.createElement('div');
                dia.className = 'tarjeta-dia';
                dia.innerHTML = `
                    <div class="card-dia">${new Date(data.daily.time[i]).toLocaleDateString('es-ES', {weekday: 'long'}).charAt(0).toUpperCase() + new Date(data.daily.time[i]).toLocaleDateString('es-ES', {weekday: 'long'}).slice(1)}</div>
                    <div class="card-icono">${icono}</div>
                    <div class="card-viento">${rayas}<br>${viento} km/h</div>
                    <div class="card-temps">
                        <span class="temp-max">max: ${max}º</span>
                        <span class="temp-min">min: ${min}º</span>
                    </div>
                `;
                contenedor.appendChild(dia);
            }
        } catch(e) { contenedor.innerHTML = "Error al cargar la información."; }
    }
    cargarTiempo(false);
});
