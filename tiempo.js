/ tiempo.js - Versión oficial con datos de la Agencia Estatal de Meteorología (AEMET)

// Tu clave de API personal de AEMET OpenData
const AEMET_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXJvbGluYXJ0aWVkYTExQGdtYWlsLmNvbSIsImp0aSI6ImE2ZmYxNThmLWRjY2MtNGIzYy1hOTYyLTZhMzU4MTE3NTRmZiIsImV4cCI6MTc5NDk2NDU0MiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3ODYzMjQ1NDIsInVzZXJJZCI6ImE2ZmYxNThmLWRjY2MtNGIzYy1hOTYyLTZhMzU4MTE3NTRmZiIsInJvbGUiOiIifQ.AaOcuSulR2l_VrjKDv8CM-ArqKKgu3PJtH_fQVF5yAw";

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Configuración del botón Volver para regresar al menú principal
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
        elementoUbicacion.innerText = `${usuario.localidad} 📍`;
    }

    let datosPrevisionGlobal = null;
    let viendoProximaSemana = false;

    // 4. Configuración del botón para alternar entre esta semana y la siguiente
    const btnCambiarSemana = document.getElementById('btn-cambiar-semana');
    if (btnCambiarSemana) {
        btnCambiarSemana.onclick = () => {
            viendoProximaSemana = !viendoProximaSemana;
            pintarPrevisionAemet(viendoProximaSemana);
        };
    }

    // 5. Descarga de datos oficiales mediante la API de AEMET OpenData
    try {
        const contenedor = document.getElementById('contenedor-dias');
        contenedor.innerHTML = `<div style="text-align: center; padding: 30px; color: #555; font-weight: bold;">Conectando con AEMET oficial... ⏳</div>`;

        // A. Consultamos la lista maestra de municipios de España para localizar el código ID de su pueblo
        const resMaestro = await fetch(`https://opendata.aemet.es/opendata/api/maestro/municipios?api_key=${AEMET_KEY}`);
        const dataMaestro = await resMaestro.json();
        
        const resUrlMunicipios = await fetch(dataMaestro.datos);
        const listaMunicipios = await resUrlMunicipios.json();

        // Función para limpiar tildes y mayúsculas en la búsqueda de la localidad
        const normalizar = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const localidadBuscada = normalizar(usuario.localidad);

        const municipioEncontrado = listaMunicipios.find(m => normalizar(m.nombre) === localidadBuscada);

        if (!municipioEncontrado) {
            throw new Error("Localidad no encontrada en el catálogo de AEMET");
        }

        // Extraemos el código numérico del municipio (ej: id12021 -> 12021)
        const codigoMun = municipioEncontrado.id.replace("id", "");

        // B. Solicitamos la predicción diaria específica para ese municipio en AEMET
        const resPred = await fetch(`https://opendata.aemet.es/opendata/api/prediccion/especifica/municipios/diaria/${codigoMun}?api_key=${AEMET_KEY}`);
        const dataPred = await resPred.json();

        const resDatosReales = await fetch(dataPred.datos);
        const jsonDataReal = await resDatosReales.json();

        // Guardamos los días de predicción oficiales
        datosPrevisionGlobal = jsonDataReal[0].prediccion.dia;

        // Renderizamos la previsión actual
        pintarPrevisionAemet(false);

    } catch (error) {
        const contenedor = document.getElementById('contenedor-dias');
        if (contenedor) {
            contenedor.innerHTML = `<div style="text-align: center; padding: 30px; color: #E74C3C; font-weight: bold;">Error al conectar con AEMET. Revisa que el nombre de tu localidad en el perfil sea exacto.</div>`;
        }
    }

    // 6. Función inteligente de renderizado adaptada a los datos de la Agencia
    function pintarPrevisionAemet(esProxima) {
        if (!datosPrevisionGlobal) return;

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

        // Definimos los tramos de días según la disponibilidad de la API oficial
        const inicio = esProxima ? Math.min(3, datosPrevisionGlobal.length) : 0;
        const fin = Math.min(inicio + 7, datosPrevisionGlobal.length);

        for (let i = inicio; i < fin; i++) {
            const diaInfo = datosPrevisionGlobal[i];
            
            const fechaObj = new Date(diaInfo.fecha);
            let nombreDia = fechaObj.toLocaleDateString('es-ES', { weekday: 'long' });
            nombreDia = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);

            const max = diaInfo.temperatura.max;
            const min = diaInfo.temperatura.min;

            // Extraemos la velocidad máxima del viento prevista para el día
            let vientoKmh = 0;
            if (diaInfo.viento && diaInfo.viento.length > 0) {
                vientoKmh = Math.max(...diaInfo.viento.map(v => v.velocidad));
            }

            // Obtenemos el código de estado del cielo de AEMET
            let estadoCielo = "11";
            if (diaInfo.estadoCielo && diaInfo.estadoCielo.length > 0) {
                estadoCielo = String(diaInfo.estadoCielo[0].value);
            }

            // Traducción de códigos AEMET a iconos visuales de la app
            let iconoClima = "☀️";
            if (estadoCielo.includes("12") || estadoCielo.includes("13") || estadoCielo.includes("14") || estadoCielo.includes("15") || estadoCielo.includes("16") || estadoCielo.includes("17")) {
                iconoClima = "⛅"; // Nublado / Parcial
            } else if (estadoCielo.includes("23") || estadoCielo.includes("24") || estadoCielo.includes("43") || estadoCielo.includes("44") || estadoCielo.includes("45")) {
                iconoClima = "🌧️"; // Lluvia
            } else if (estadoCielo.includes("51") || estadoCielo.includes("52") || estadoCielo.includes("61") || estadoCielo.includes("71")) {
                iconoClima = "⛈️"; // Tormenta
            }

            // Aplicación de tus reglas estrictas de viento:
            // - Suave: menos de 19 km/h (1 raya)
            // - Medio: de 20 a 38 km/h (2 rayas)
            // - Fuerte: 39 km/h en adelante (3 rayas)
            let ondasViento = `<span>〰️</span>`;
            if (vientoKmh >= 20 && vientoKmh <= 38) {
                ondasViento = `<span>〰️</span><br><span>〰️</span>`;
            } else if (vientoKmh >= 39) {
                ondasViento = `<span>〰️</span><br><span>〰️</span><br><span>〰️</span>`;
            }

            // Construcción de la tarjeta física de la fila
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
