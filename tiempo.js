// tiempo.js - El cerebro de la meteorología

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Botón Volver
    document.getElementById('btn-volver-tiempo').addEventListener('click', () => {
        window.location.href = 'menu.html';
    });

    // 2. Recuperar la localidad del usuario
    const usuario = JSON.parse(localStorage.getItem('usuarioContigo'));
    if (!usuario || !usuario.localidad) {
        window.location.href = 'menu.html'; // Seguridad por si entran directo
        return;
    }
    
    document.getElementById('titulo-localidad').innerText = `${usuario.localidad} 📍`;

    let datosMeteorologicos = null;
    let viendoProximaSemana = false;

    // 3. Buscar coordenadas y tiempo en la base de datos libre (Open-Meteo)
    try {
        // Primero convertimos el nombre del pueblo en coordenadas
        const resGeo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(usuario.localidad)}&language=es&count=1`);
        const datosGeo = await resGeo.json();
        
        if (!datosGeo.results || datosGeo.results.length === 0) throw new Error("Localidad no encontrada");
        
        const lat = datosGeo.results[0].latitude;
        const lon = datosGeo.results[0].longitude;

        // Pedimos el tiempo (días pasados para asegurar que tenemos el Lunes, y 14 días al futuro)
        const resTiempo = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=Europe%2FMadrid&past_days=7&forecast_days=14`);
        datosMeteorologicos = await resTiempo.json();

        document.getElementById('cargando-tiempo').style.display = 'none';
        document.getElementById('contenedor-dias').classList.remove('oculto');
        
        dibujarSemana(false); // Dibujamos esta semana
        
    } catch (error) {
        document.getElementById('cargando-tiempo').innerText = "Hubo un error al buscar el tiempo. Revisa tu internet.";
    }

    // 4. Botón para cambiar entre Esta Semana y Próxima Semana
    document.getElementById('btn-cambiar-semana').addEventListener('click', () => {
        viendoProximaSemana = !viendoProximaSemana;
        
        const textoSemana = document.getElementById('texto-semana');
        const btnCambiar = document.getElementById('btn-cambiar-semana');
        
        if (viendoProximaSemana) {
            textoSemana.innerText = "Próxima Semana";
            btnCambiar.innerHTML = "&larr; Ver Esta Semana";
            btnCambiar.style.backgroundColor = "#F39C12"; // Naranja para destacar
        } else {
            textoSemana.innerText = "Esta Semana";
            btnCambiar.innerHTML = "Ver Próxima Semana &rarr;";
            btnCambiar.style.backgroundColor = "var(--verde-contigo)";
        }
        
        dibujarSemana(viendoProximaSemana);
    });

    // 5. Función que dibuja las tarjetas L-D
    function dibujarSemana(esProxima) {
        const contenedor = document.getElementById('contenedor-dias');
        contenedor.innerHTML = "";
        
        // Cambiar textos según semana
        const textoEstado = document.getElementById('texto-estado-semana');
        const btnCambiar = document.getElementById('btn-cambiar-semana');
        if(esProxima) {
            textoEstado.innerText = "Estas viendo la previsión de la próxima semana";
            btnCambiar.innerText = "Ver esta semana";
        } else {
            textoEstado.innerText = "Estas viendo la previsión para esta semana";
            btnCambiar.innerText = "Ver siguiente semana";
        }

        // ... (cálculo de fechas igual que antes)

        for (let i = 0; i < 7; i++) {
            // ... (cálculo de índices igual)

            // Viento con km/h
            const vientoVelocidad = datosMeteorologicos.daily.windspeed_10m_max[indice];
            let vientoIcono = "〰️";
            if (vientoVelocidad > 15) vientoIcono = "〰️〰️";
            if (vientoVelocidad > 30) vientoIcono = "〰️〰️〰️";

            tarjeta.innerHTML = `
                <div class="nombre-dia">${textoDia}</div>
                <div class="icono-clima">${climaIcono}</div>
                <div class="info-viento">${vientoIcono}<br>${Math.round(vientoVelocidad)} km/h</div>
                <div class="info-temps">
                    <span class="temp-max">max. ${max}º</span><br>
                    <span class="temp-min">min. ${min}º</span>
                </div>
            `;
            contenedor.appendChild(tarjeta);
        }
    }
