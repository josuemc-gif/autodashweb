import { Wrench } from 'lucide-react'
import './mantenimiento.css'

const columns = ['Pendiente', 'En curso', 'Completado']

export function SeccionMantenimiento({ tasks, moveTask }) {
  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> CUIDADO DEL VEHÍCULO</div>
          <h1>Mantenimiento<span>.</span></h1>
          <p>Organiza las revisiones y reparaciones de tu carrito.</p>
        </div>
        <span className="board-count"><Wrench size={15} /> {tasks.length} tareas</span>
      </div>

      <div className="kanban-board">
        {columns.map((column) => (
          <section className="kanban-column" key={column}>
            <div className="kanban-heading">
              <span className={`column-dot ${column.toLowerCase().replace(' ', '-')}`} />
              <h2>{column}</h2>
              <span className="column-count">{tasks.filter((task) => task.status === column).length}</span>
            </div>

            {tasks.filter((task) => task.status === column).map((task) => (
              <article className="task-card" key={task.id}>
                <span className="task-type"><Wrench size={13} /> VEHÍCULO</span>
                <h3>{task.title}</h3>
                <p>{task.detail}</p>
                <label className="task-move">
                  Mover a
                  <select aria-label={`Estado de ${task.title}`} value={task.status} onChange={(event) => moveTask(task.id, event.target.value)}>
                    {columns.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
              </article>
            ))}

            {!tasks.some((task) => task.status === column) && <div className="column-empty">Sin tareas</div>}
          </section>
        ))}
      </div>
    </section>
  )
}
