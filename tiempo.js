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
        contenedor.innerHTML = ""; // Limpiamos la pantalla

        // Calculamos qué día es el Lunes de esta semana
        let hoy = new Date();
        let diaSemana = hoy.getDay() || 7; // Convertimos Domingo (0) en 7
        let lunesEstaSemana = new Date(hoy);
        lunesEstaSemana.setDate(hoy.getDate() - (diaSemana - 1));

        // Si es próxima semana, le sumamos 7 días al Lunes
        if (esProxima) {
            lunesEstaSemana.setDate(lunesEstaSemana.getDate() + 7);
        }

        const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

        // Generamos los 7 días
        for (let i = 0; i < 7; i++) {
            let fechaObjetivo = new Date(lunesEstaSemana);
            fechaObjetivo.setDate(lunesEstaSemana.getDate() + i);
            
            // Convertimos la fecha a texto (Ej: "2026-08-10") para buscarla en los datos
            const textoFecha = fechaObjetivo.toISOString().split('T')[0];
            const indice = datosMeteorologicos.daily.time.indexOf(textoFecha);

            if (indice !== -1) {
                const max = Math.round(datosMeteorologicos.daily.temperature_2m_max[indice]);
                const min = Math.round(datosMeteorologicos.daily.temperature_2m_min[indice]);
                const vientoNum = datosMeteorologicos.daily.windspeed_10m_max[indice];
                const codigoClima = datosMeteorologicos.daily.weathercode[indice];

                // Las rayitas de viento que pediste
                let vientoIcono = "〰️"; // Poco
                if (vientoNum >= 15 && vientoNum <= 30) vientoIcono = "〰️〰️"; // Medio
                if (vientoNum > 30) vientoIcono = "〰️〰️〰️"; // Mucho

                // Convertir códigos a iconos del clima
                let climaIcono = "☀️";
                if (codigoClima >= 1 && codigoClima <= 3) climaIcono = "⛅";
                if (codigoClima >= 45 && codigoClima <= 48) climaIcono = "🌫️";
                if (codigoClima >= 51 && codigoClima <= 67) climaIcono = "🌧️";
                if (codigoClima >= 71 && codigoClima <= 77) climaIcono = "❄️";
                if (codigoClima >= 95) climaIcono = "⛈️"; // Tormenta (Nube con rayo)

                // Crear la tarjeta
                const tarjeta = document.createElement('div');
                tarjeta.className = "tarjeta-dia";
                
                // Si la fecha objetivo es hoy, lo resaltamos
                let textoDia = nombresDias[i];
                if (textoFecha === hoy.toISOString().split('T')[0]) {
                    textoDia = "Hoy";
                    tarjeta.style.border = "3px solid var(--verde-contigo)";
                }

                tarjeta.innerHTML = `
                    <div class="dia-nombre">${textoDia}</div>
                    <div class="dia-icono">${climaIcono}</div>
                    <div class="dia-viento" title="${vientoNum} km/h">${vientoIcono}</div>
                    <div class="dia-temps">
                        <div class="temp-max">${max}º</div>
                        <div class="temp-min">${min}º</div>
                    </div>
                `;
                contenedor.appendChild(tarjeta);
            }
        }
    }
});
