export async function consultarClima(latitud, longitud) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitud}&longitude=${longitud}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=precipitation_probability&timezone=auto`
  const respuesta = await fetch(url)
  if (!respuesta.ok) throw new Error('No se pudo consultar el clima local.')

  const datos = await respuesta.json()
  const horaActual = `${datos.current.time.slice(0, 13)}:00`
  const indiceProbabilidad = datos.hourly.time.findIndex((hora) => hora === horaActual)

  return {
    ...datos.current,
    precipitation_probability: datos.hourly.precipitation_probability[indiceProbabilidad] ?? null,
  }
}
