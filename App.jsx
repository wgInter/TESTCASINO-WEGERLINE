import { useState } from 'react';

function Boton({ children, alHacerClic, variante = 'primario', cargando = false }) {
  return (
    <button
      className={`boton boton--${variante}`}
      onClick={alHacerClic}
      disabled={cargando}
    >
      {cargando ? 'Procesando...' : children}
    </button>
  );
}
function FilaEstudiante({ estudiante }) {
  const estado = estudiante.nota >= 3.0 ? 'Aprobado' : 'Reprobado';
  return (
    <tr>
      <td>{estudiante.nombre}</td>
      <td>{estudiante.nota}</td>
      <td>{estado}</td>
    </tr>
  );
}
function App() {
  const [estudiantes, setEstudiantes] = useState([
    { id: 1, nombre: 'Ana maria', nota: 4.5 },
    { id: 2, nombre: 'Luis miguel', nota: 2.8 }
  ]);
  const [nombre, setNombre] = useState('');

  function agregar() {
    if (nombre.trim() === '') return; // no agrega si el campo está vacío
    const nota = Number((Math.random() * 5).toFixed(1)); // nota al azar
    const nuevo = { id: Date.now(), nombre: nombre.trim(), nota };
    setEstudiantes([...estudiantes, nuevo]); // arreglo NUEVO, no push
    setNombre(''); // limpia el campo
  }

  return (
    <>
      <h1>Notas</h1>

      <input
        placeholder="Nombre del estudiante"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
      />
      <Boton alHacerClic={agregar}>Agregar estudiante</Boton>

      <table>
        <thead>
          <tr><th>Nombre</th><th>Nota</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {estudiantes.map(e => <FilaEstudiante key={e.id} estudiante={e} />)}
        </tbody>
      </table>
    </>
  );
}

export default App;