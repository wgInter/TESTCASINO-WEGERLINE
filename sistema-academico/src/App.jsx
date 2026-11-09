import { useState } from 'react';

function Boton({ children, alHacerClic, variante = 'primario', cargando = false }) {
  return (
    <button
      className={`btn btn-${variante}`}
      onClick={alHacerClic}
      disabled={cargando}
    >
      {cargando ? 'Cargando...' : children}
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
    { id: 1, nombre: 'Ana', nota: 4.5 }
  ]);
  const [nombre, setNombre] = useState('');

  function agregar() {
    if (nombre.trim() === '') return;
    const nuevo = { id: Date.now(), nombre: nombre.trim(), nota: 3.2 };
    setEstudiantes([...estudiantes, nuevo]); // arreglo nuevo, no push
    setNombre('');
  }

  return (
    <>
      <h1>Notas</h1>

      <input
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        placeholder="Nombre del estudiante"
      />
      <Boton alHacerClic={agregar}>Agregar estudiante</Boton>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nota</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {estudiantes.map(e => (
            <FilaEstudiante key={e.id} estudiante={e} />
          ))}
        </tbody>
      </table>
    </>
  );
}

export default App;

F