export async function buscarDestinos(consulta, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=es&q=${encodeURIComponent(consulta)}`
  const respuesta = await fetch(url, { signal })
  if (!respuesta.ok) throw new Error('No se pudo buscar ese lugar.')

  const lugares = await respuesta.json()
  return lugares.map((lugar) => ({
    name: lugar.name || lugar.display_name.split(',')[0],
    detail: lugar.display_name,
    lat: Number(lugar.lat),
    lon: Number(lugar.lon),
  }))
}
