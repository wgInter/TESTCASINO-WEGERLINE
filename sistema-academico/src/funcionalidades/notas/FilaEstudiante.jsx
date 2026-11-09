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

export default FilaEstudiante;
