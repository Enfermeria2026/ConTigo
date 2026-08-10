/ tiempo.js - Versión segura y optimizada para evitar bloqueos y asegurar los botones

document.addEventListener('DOMContentLoaded', () => {
    // 1. EL BOTÓN VOLVER FUNCIONA SIEMPRE (Independientemente de que la API falle o cargue)
    const btnVolver = document.getElementById('btn-volver-tiempo');
    if (btnVolver) {
        btnVolver.onclick = () => {
            window.location.href = 'menu.html';
        };
    }

    // 2. Recuperamos los datos del usuario logueado
    const usuarioRecuperado = localStorage.getItem('usuarioContigo');
    if (!usuarioRecuperado) {
        window.location.href = 'index.html';
        return;
    }
    const usuario = JSON.parse(usuarioRecuperado);

    // 3. Verificamos que tenga localidad escrita en el perfil
    const elementoUbicacion = document.getElementById('titulo-localidad');
    if (!usuario.localidad) {
        if (elementoUbicacion) elementoUbicacion.innerText = "Sin localidad 📍";
        return;
    }
    if (elementoUbicacion) {
        elementoUbicacion.innerText = `${usuario.localidad}`;
    }

    let datosMeteorologicosGlobales = null;
    let viendoProximaSemana = false;

    // 4. Configuración del botón para alternar entre esta semana y la siguiente
    const btnCambiarSemana = document.getElementById('btn-cambiar-semana');
    if (btnCambiarSemana) {
        btnCambiarSemana.onclick = () => {
            viendoProximaSemana = !viendoProximaSemana;
            pintarPrevision(viendoProximaSemana);
        };
    }

    // 5. Carga de datos meteorológicos optimizada y compatible con navegadores
    async function iniciarCarga() {
        const contenedor = document.getElementById('contenedor-dias');
        if (contenedor) {
            contenedor.innerHTML = `<div style="text-align: center; padding: 30px; color: #555; font-weight: bold;">Cargando previsión... ⏳</div>`;
        }

        try {
            // A. Obtenemos las coordenadas de la localidad
            const resGeo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(usuario.localidad)}&count=1&language=es`);
            const datosGeo = await resGeo.json();

            if (!datosGeo.results || datosGeo.results.length === 0) {
                throw new Error("Localidad no encontrada");
            }

            const { latitude, longitude } = datosGeo.results[0];

            // B. Solicitamos la previsión diaria de 14 días
            const resTiempo = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=Europe%2FMadrid&forecast_days=14`);
            datosMeteorologicosGlobales = await resTiempo.json();

            // C. Pintamos la semana actual por defecto
            pintarPrevision(false);

        } catch (error) {
            if (contenedor) {
                contenedor.innerHTML = `<div style="text-align: center; padding: 30px; color: #E74C3C; font-weight: bold;">No se ha podido cargar la previsión. Comprueba que el nombre de tu localidad sea correcto en el perfil.</div>`;
            }
        }
    }

    // 6. Función inteligente encargada de dibujar los 7 días de la semana
    function pintarPrevision(esProxima) {
        if (!datosMeteorologicosGlobales) return;

        const contenedor = document.getElementById('contenedor-dias');
        const textoEstado = document.getElementById('texto-estado-semana');
        const btnCambiar = document.getElementById('btn-cambiar-semana');

        contenedor.innerHTML = "";

        if (esProxima) {
            textoEstado.innerText = "Estás viendo la previsión de la semana que viene";
            btnCambiar.innerText = "Ver esta semana";
        } else {
            textoEstado.innerText = "Estás viendo la previsión de esta semana";
            btnCambiar.innerText = "Ver siguiente semana";
        }

        // Definimos los tramos de días (0-6 para esta semana, 7-13 para la próxima)
        const inicio = esProxima ? 7 : 0;
        const fin = inicio + 7;

        for (let i = inicio; i < fin; i++) {
            const fechaStr = datosMeteorologicosGlobales.daily.time[i];
            const max = Math.round(datosMeteorologicosGlobales.daily.temperature_2m_max[i]);
            const min = Math.round(datosMeteorologicos.daily.temperature_2m_min[i]);
            const vientoKmh = Math.round(datosMeteorologicos.daily.windspeed_10m_max[i]);
            const codigoClima = datosMeteorologicosGlobales.daily.weathercode[i];

            // Nombre del día en castellano
            const fechaObjeto = new Date(fechaStr);
            let nombreDia = fechaObjeto.toLocaleDateString('es-ES', { weekday: 'long' });
            nombreDia = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);

            // Iconos climáticos
            let iconoClima = "☀️";
            if (codigoClima >= 1 && codigoClima <= 3) iconoClima = "⛅";
            if (codigoClima >= 45 && codigoClima <= 48) iconoClima = "🌫️";
            if (codigoClima >= 51 && codigoClima <= 67) iconoClima = "🌧️";
            if (codigoClima >= 71 && codigoClima <= 77) iconoClima = "❄️";
            if (codigoClima >= 95) iconoClima = "⛈️";

            // Reglas de viento estrictas:
            // - Suave: < 19 km/h (1 raya)
            // - Medio: 20 - 38 km/h (2 rayas)
            // - Fuerte: >= 39 km/h (3 rayas)
            let ondasViento = `<span>〰️</span>`;
            if (vientoKmh >= 20 && vientoKmh <= 38) {
                ondasViento = `<span>〰️</span><br><span>〰️</span>`;
            } else if (vientoKmh >= 39) {
                ondasViento = `<span>〰️</span><br><span>〰️</span><br><span>〰️</span>`;
            }

            // Construcción de la tarjeta física
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

    // Ejecutamos la carga inicial
    iniciarCarga();
});
