// Muestra cargando / error / vacío, o el contenido. Reutilizado en eventos e historial.
export default function EstadoDatos({ cargando, error, vacio, textoVacio, children }) {
  if (cargando) return <p className="aviso">Cargando…</p>;
  if (error) return <p className="aviso aviso--error">{error}</p>;
  if (vacio) return <p className="aviso">{textoVacio}</p>;
  return children;
}
