# AutoDash

Panel web para el seguimiento y cuidado de un carrito desde una tableta, teléfono o computadora.

## Estructura del código

- `src/aplicacion.jsx` coordina las vistas, el estado compartido y las preferencias.
- `src/componentes/estructura` contiene la barra lateral y la barra superior.
- `src/componentes/panel` contiene el panel principal y el botón reutilizable para iniciar o finalizar trayectos.
- `src/componentes/navegacion` contiene la búsqueda de destinos y el mapa.
- `src/componentes/trayectos`, `mantenimiento`, `multimedia` y `configuracion` contienen sus vistas y estilos.
- `src/servicios` contiene el seguimiento GPS, la batería del teléfono y las consultas de clima y destinos.
- `src/utilidades` contiene funciones reutilizables; `src/estilos` contiene estilos globales, temas y reglas adaptables.
- `src/inicio.jsx` es el punto de entrada React.

## Desarrollo

```sh
npm install
npm run dev
```

El servidor local usa siempre `http://localhost:5173`. Si ese puerto está ocupado, cierra el otro servidor de desarrollo antes de iniciar este proyecto. Los datos del navegador se conservan al reiniciar VS Code mientras se use la misma dirección y no se borren los datos del sitio.

## Datos y conexiones

- La velocidad y la distancia del trayecto usan la geolocalización del navegador. El usuario debe conceder permiso; para tablets y teléfonos el sitio publicado necesita HTTPS.
- El clima y la probabilidad de lluvia vienen de Open-Meteo según la ubicación aproximada del dispositivo.
- El mapa usa OpenStreetMap, Nominatim y OSRM. El cálculo de ruta requiere GPS y conexión a Internet.
- El nivel de batería, la autonomía y el consumo no se simulan: requieren sensores instalados y un protocolo compatible con el vehículo. El módulo Bluetooth todavía no implementa un protocolo del carrito.
- Multimedia permite buscar y reproducir audio de Wikimedia Commons, sin API key, con atribución y licencia disponibles en cada resultado. El catálogo incluye audio libre, no todas las canciones comerciales, y requiere conexión a Internet. También permite reproducir archivos locales, que no se suben a Internet, y buscar videos de YouTube con `VITE_YOUTUBE_API_KEY`; la búsqueda filtra videos disponibles para reproducción integrada y los carga con YouTube IFrame Player API. Si YouTube rechaza un video o falla la conexión, AutoDash muestra el motivo y permite reintentar. Esa clave queda visible para los usuarios del sitio.
- Historial, tareas y preferencias se guardan en el almacenamiento local del navegador y no se sincronizan entre dispositivos. Si se cierra o recarga la página durante un trayecto, se recuperan el trayecto y la distancia acumulada; vuelve a activar el GPS para continuar registrando.

## Publicación permanente

Al subir cambios a `main`, GitHub Actions compila y publica la aplicación en GitHub Pages: <https://josuemc-gif.github.io/autodashweb/>.

En la configuración del repositorio, habilita GitHub Pages con **Settings → Pages → Build and deployment → Source: GitHub Actions**. El flujo de trabajo de `.github/workflows/deploy-pages.yml` se encarga de compilar y publicar. Para habilitar la búsqueda de videos de YouTube, agrega `VITE_YOUTUBE_API_KEY` como variable del repositorio en **Settings → Secrets and variables → Actions → Variables**, o como secreto del repositorio en **Settings → Secrets and variables → Actions → Secrets**. El build acepta cualquiera de las dos opciones (si existen ambas, usa la variable). La clave se incluye en el JavaScript público del sitio, así que debe restringirse en Google Cloud.

La aplicación también genera archivos estáticos que pueden alojarse en Netlify, Cloudflare Pages o un proveedor equivalente. Para un despliegue manual en Netlify:

1. Ejecuta `npm run build`.
2. Inicia sesión o crea una cuenta en Netlify y publica la carpeta `dist` en el servicio de despliegue manual.
3. Netlify asignará una dirección HTTPS estable. Conserva el mismo sitio al volver a publicar para mantener la dirección.

También se incluye `netlify.toml` para que Netlify compile el proyecto automáticamente cuando el repositorio se conecte a una cuenta.