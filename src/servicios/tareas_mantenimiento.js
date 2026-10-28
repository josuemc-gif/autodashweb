import { useEffect, useState } from 'react'

const tareasIniciales = [
  { id: 1, title: 'Revisar presión de neumáticos', detail: 'Inspección · cada 30 días', status: 'Pendiente' },
  { id: 2, title: 'Comprobar luces delanteras', detail: 'Seguridad · cada 60 días', status: 'Pendiente' },
  { id: 3, title: 'Limpiar cadena y transmisión', detail: 'Mecánica · cada 500 km', status: 'En curso' },
  { id: 4, title: 'Ajustar freno trasero', detail: 'Seguridad · 18 sep 2026', status: 'Completado' },
]

function leerTareas() {
  try {
    return JSON.parse(localStorage.getItem('autodash-tasks')) || tareasIniciales
  } catch {
    return tareasIniciales
  }
}

export function useTareasMantenimiento() {
  const [tareas, setTareas] = useState(leerTareas)

  useEffect(() => {
    localStorage.setItem('autodash-tasks', JSON.stringify(tareas))
  }, [tareas])

  function cambiarEstadoTarea(idTarea, estado) {
    setTareas((actuales) => actuales.map((tarea) => (
      tarea.id === idTarea ? { ...tarea, status: estado } : tarea
    )))
  }

  return { tareas, cambiarEstadoTarea }
}
