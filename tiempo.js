// tiempo.js - Lógica completa para la pantalla de El Tiempo

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Configuración del botón Volver para regresar al menú principal
    const btnVolver = document.getElementById('btn-volver-tiempo');
    if (btnVolver) {
        btnVolver.onclick = () => {
            window.location.href = 'menu.html';
        };
    }

    // 2. Recuperamos los datos del usuario logueado en la aplicación
    const usuarioRecuperado = localStorage.getItem('usuarioContigo');
    if (!usuarioRecuperado) {
        window.location.href = 'index.html';
        return;
    }
    const usuario = JSON.parse(usuarioRecuperado);

    // 3. Verificamos que la localidad esté escrita en el perfil
    const elementoUbicacion = document.getElementById('titulo-localidad');
    if (!usuario.localidad) {
        if (elementoUbicacion) elementoUbicacion.innerText = "Sin localidad 📍";
        return;
    }

    if (elementoUbicacion) {
        elementoUbicacion.innerText = `${usuario.localidad} 📍`;
    }

    let datosMeteorologicos = null;
    let viendoProximaSemana = false;

    // 4. Configuración del botón naranja para alternar semanas
    const btnCambiarSemana = document.getElementById('btn-cambiar-semana');
    if (btnCambiarSemana) {
        btnCambiarSemana.onclick = () => {
            viendoProximaSemana = !viendoProximaSemana;
            pintarPrevision(viendoProximaSemana);
        };
    }

    // 5. Descarga de datos meteorológicos mediante la API gratuita Open-Meteo
    try {
        // A. Obtenemos las coordenadas geográficas de la localidad mediante geocodificación
        const resGeo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(usuario.localidad)}&count=1&language=es`);
        const datosGeo = await resGeo.json();

        if (!datosGeo.results || datosGeo.results.length === 0) {
            throw new Error("Localidad no encontrada");
        }

        const { latitude, longitude } = datosGeo.results[0];

        // B. Solicitamos la previsión meteorológica para 14 días (necesaria para esta semana y la próxima)
        const resTiempo = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=Europe%2FMadrid&forecast_days=14`);
        datosMeteorologicos = await resTiempo.json();

        // C. Renderizamos la semana actual por defecto
        pintarPrevision(false);

    } catch (error) {
        const contenedor = document.getElementById('contenedor-dias');
        if (contenedor) {
            contenedor.innerHTML = `<div style="text-align: center; padding: 30px; color: #E74C3C; font-weight: bold;">No se ha podido cargar la previsión del tiempo. Comprueba tu conexión a internet.</div>`;
        }
    }

    // 6. Función principal encargada de pintar los 7 días de la semana seleccionada
    function pintarPrevision(esProxima) {
        if (!datosMeteorologicos) return;

        const contenedor = document.getElementById('contenedor-dias');
        const textoEstado = document.getElementById('texto-estado-semana');
        const btnCambiar = document.getElementById('btn-cambiar-semana');

        contenedor.innerHTML = "";

        // Actualizamos los textos de control según la semana que se visualiza
        if (esProxima) {
            textoEstado.innerText = "Estás viendo la previsión de la semana que viene";
            btnCambiar.innerText = "Ver esta semana";
        } else {
            textoEstado.innerText = "Estás viendo la previsión de esta semana";
            btnCambiar.innerText = "Ver siguiente semana";
        }

        // Definimos el rango (0 a 6 para esta semana, 7 a 13 para la próxima)
        const inicio = esProxima ? 7 : 0;
        const fin = inicio + 7;

        for (let i = inicio; i < fin; i++) {
            const fechaStr = datosMeteorologicos.daily.time[i];
            const max = Math.round(datosMeteorologicos.daily.temperature_2m_max[i]);
            const min = Math.round(datosMeteorologicos.daily.temperature_2m_min[i]);
            const vientoKmh = Math.round(datosMeteorologicos.daily.windspeed_10m_max[i]);
            const codigoClima = datosMeteorologicos.daily.weathercode[i];

            // Obtenemos el nombre del día en castellano con la primera letra en mayúscula
            const fechaObjeto = new Date(fechaStr);
            let nombreDia = fechaObjeto.toLocaleDateString('es-ES', { weekday: 'long' });
            nombreDia = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);

            // Asignación de iconos según el código meteorológico oficial
            let iconoClima = "☀️";
            if (codigoClima >= 1 && codigoClima <= 3) iconoClima = "⛅";
            if (codigoClima >= 45 && codigoClima <= 48) iconoClima = "🌫️";
            if (codigoClima >= 51 && codigoClima <= 67) iconoClima = "🌧️";
            if (codigoClima >= 71 && codigoClima <= 77) iconoClima = "❄️";
            if (codigoClima >= 95) iconoClima = "⛈️";

            // Generación de las ondas de viento apiladas verticalmente según la velocidad
            let ondasViento = `<span>〰️</span>`;
            if (vientoKmh > 15 && vientoKmh <= 30) {
                ondasViento = `<span>〰️</span><span>〰️</span>`;
            } else if (vientoKmh > 30) {
                ondasViento = `<span>〰️</span><span>〰️</span><span>〰️</span>`;
            }

            // Creación de la tarjeta individual en formato de fila única vertical
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-dia';

            tarjeta.innerHTML = `
                <div class="card-dia">${nombreDia}</div>
                <div class="card-icono">${iconoClima}</div>
                <div class="card-viento">
                    <div class="bloque-rayas">${ondasViento}</div>
                    <span>${vientoKmh} km/h</span>
                </div>
                <div class="card-temps">
                    <span class="temp-max">max: ${max}ºC</span>
                    <span class="temp-min">min: ${min}ºC</span>
                </div>
            `;

            contenedor.appendChild(tarjeta);
        }
    }
});
