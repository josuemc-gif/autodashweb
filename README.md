# AutoDash

Panel web para el seguimiento y cuidado de un carrito desde una tableta, teléfono o computadora.

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
- El multimedia es una interfaz de demostración; no reproduce audio real.
- Historial, tareas y preferencias se guardan en el almacenamiento local del navegador y no se sincronizan entre dispositivos. Si se cierra o recarga la página durante un trayecto, se recuperan el trayecto y la distancia acumulada; vuelve a activar el GPS para continuar registrando.

## Publicación permanente

La aplicación genera archivos estáticos que pueden alojarse en Netlify, Cloudflare Pages o un proveedor equivalente. Para un despliegue manual en Netlify:

1. Ejecuta `npm run build`.
2. Inicia sesión o crea una cuenta en Netlify y publica la carpeta `dist` en el servicio de despliegue manual.
3. Netlify asignará una dirección HTTPS estable. Conserva el mismo sitio al volver a publicar para mantener la dirección.

También se incluye `netlify.toml` para que Netlify compile el proyecto automáticamente cuando el repositorio se conecte a una cuenta.