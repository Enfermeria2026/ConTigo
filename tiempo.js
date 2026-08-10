document.addEventListener('DOMContentLoaded', async () => {
    const btnVolver = document.getElementById('btn-volver-tiempo');
    btnVolver.onclick = () => window.location.href = 'menu.html';

    const usuario = JSON.parse(localStorage.getItem('usuarioContigo'));
    if (!usuario || !usuario.localidad) { window.location.href = 'menu.html'; return; }
    
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
            // Buscamos coordenadas de forma directa
            const resGeo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${usuario.localidad}&count=1`);
            const geo = await resGeo.json();
            const { latitude, longitude } = geo.results[0];
            
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=Europe/Madrid&forecast_days=14`);
            const data = await res.json();
            
            contenedor.innerHTML = "";
            const start = proxima ? 7 : 0;
            
            for (let i = start; i < start + 7; i++) {
                const dia = document.createElement('div');
                dia.className = 'tarjeta-dia';
                dia.innerHTML = `
                    <div style="width: 25%">${new Date(data.daily.time[i]).toLocaleDateString('es-ES', {weekday: 'long'})}</div>
                    <div style="width: 15%">⛅</div>
                    <div style="width: 30%">${Math.round(data.daily.windspeed_10m_max[i])} km/h</div>
                    <div style="width: 30%">max: ${Math.round(data.daily.temperature_2m_max[i])}º<br>min: ${Math.round(data.daily.temperature_2m_min[i])}º</div>
                `;
                contenedor.appendChild(dia);
            }
        } catch(e) { contenedor.innerHTML = "Error al cargar el tiempo."; }
    }
    cargarTiempo(false);
});
