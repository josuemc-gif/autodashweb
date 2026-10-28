export function formatearDuracion(minutes) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`
}

export function saludoPorHora(date) {
  const hours = date.getHours()
  if (hours < 12) return 'Buenos días'
  if (hours < 19 || (hours === 19 && date.getMinutes() === 0)) return 'Buenas tardes'
  return 'Buenas noches'
}

export function distanciaEntre(from, to) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const latitudeDelta = radians(to.lat - from.lat)
  const longitudeDelta = radians(to.lng - from.lng)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(longitudeDelta / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}
