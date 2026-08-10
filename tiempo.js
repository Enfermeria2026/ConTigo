// tiempo.js - Lógica completa y detallada de la pantalla de El Tiempo

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Configuración del botón Volver para regresar de forma segura al menú principal
    const btnVolver = document.getElementById('btn-volver-tiempo');
    if (btnVolver) {
        btnVolver.onclick = () => {
            window.location.href = 'menu.html';
        };
    }

    // 2. Recuperamos la información del usuario autenticado desde la memoria local
    const usuarioRecuperado = localStorage.getItem('usuarioContigo');
    if (!usuarioRecuperado) {
        window.location.href = 'index.html';
        return;
    }
    const usuario = JSON.parse(usuarioRecuperado);

    // 3. Comprobamos que el usuario tenga una localidad asignada en su perfil
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

    // 4. Configuración del botón naranja compacto para alternar entre esta semana y la próxima
    const btnCambiarSemana = document.getElementById('btn-cambiar-semana');
    if (btnCambiarSemana) {
        btnCambiarSemana.onclick = () => {
            viendoProximaSemana = !viendoProximaSemana;
            pintarPrevision(viendoProximaSemana);
        };
    }

    // 5. Descarga de datos meteorológicos mediante la API de Open-Meteo
    try {
        // A. Transformamos el nombre de la localidad en coordenadas de latitud y longitud
        const resGeo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(usuario.localidad)}&count=1&language=es`);
        const datosGeo = await resGeo.json();

        if (!datosGeo.results || datosGeo.results.length === 0) {
            throw new Error("Localidad no encontrada");
        }

        const { latitude, longitude } = datosGeo.results[0];

        // B. Solicitamos los datos diarios de temperatura, viento y códigos climáticos para 14 días
        const resTiempo = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=Europe%2FMadrid&forecast_days=14`);
        datosMeteorologicos = await resTiempo.json();

        // C. Dibujamos por defecto la previsión de la semana actual
        pintarPrevision(false);

    } catch (error) {
        const contenedor = document.getElementById('contenedor-dias');
        if (contenedor) {
            contenedor.innerHTML = `<div style="text-align: center; padding: 30px; color: #E74C3C; font-weight: bold;">No se ha podido cargar la previsión. Comprueba tu conexión a internet.</div>`;
        }
    }

    // 6. Función inteligente que dibuja exactamente los 7 días de la semana (Lunes a Domingo)
    function pintarPrevision(esProxima) {
        if (!datosMeteorologicos) return;

        const contenedor = document.getElementById('contenedor-dias');
        const textoEstado = document.getElementById('texto-estado-semana');
        const btnCambiar = document.getElementById('btn-cambiar-semana');

        contenedor.innerHTML = "";

        // Ajustamos los textos informativos según la semana seleccionada
        if (esProxima) {
            textoEstado.innerText = "Estás viendo la previsión de la semana que viene";
            btnCambiar.innerText = "Ver esta semana";
        } else {
            textoEstado.innerText = "Estás viendo la previsión de esta semana";
            btnCambiar.innerText = "Ver siguiente semana";
        }

        // Determinamos el índice de inicio (0 para esta semana, 7 para la siguiente)
        const inicio = esProxima ? 7 : 0;
        const fin = inicio + 7; // Garantiza exactamente 7 filas (del índice 0 al 6, o 7 al 13, cubriendo siempre hasta el domingo)

        for (let i = inicio; i < fin; i++) {
            const fechaStr = datosMeteorologicos.daily.time[i];
            const max = Math.round(datosMeteorologicos.daily.temperature_2m_max[i]);
            const min = Math.round(datosMeteorologicos.daily.temperature_2m_min[i]);
            const vientoKmh = Math.round(datosMeteorologicos.daily.windspeed_10m_max[i]);
            const codigoClima = datosMeteorologicos.daily.weathercode[i];

            // Obtenemos el nombre del día en castellano con formato limpio
            const fechaObjeto = new Date(fechaStr);
            let nombreDia = fechaObjeto.toLocaleDateString('es-ES', { weekday: 'long' });
            nombreDia = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);

            // Traducción del código meteorológico a iconos visuales
            let iconoClima = "☀️";
            if (codigoClima >= 1 && codigoClima <= 3) iconoClima = "⛅";
            if (codigoClima >= 45 && codigoClima <= 48) iconoClima = "🌫️";
            if (codigoClima >= 51 && codigoClima <= 67) iconoClima = "🌧️";
            if (codigoClima >= 71 && codigoClima <= 77) iconoClima = "❄️";
            if (codigoClima >= 95) iconoClima = "⛈️";

            // Generación de las ondas de viento apiladas verticalmente
            let ondasViento = `<span>〰️</span>`;
            if (vientoKmh > 15 && vientoKmh <= 30) {
                ondasViento = `<span>〰️</span><span>〰️</span>`;
            } else if (vientoKmh > 30) {
                ondasViento = `<span>〰️</span><span>〰️</span><span>〰️</span>`;
            }

            // Construcción física de la tarjeta de la fila
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
