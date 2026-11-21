// Reutilizado en: navegación principal, deportes de Inicio, Más deportes y Cuenta.
export default function Pestanas({ opciones, activa, onCambiar }) {
  return (
    <div className="pestanas">
      {opciones.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          className={`pestana ${opcion.valor === activa ? 'pestana--activa' : ''}`}
          onClick={() => onCambiar(opcion.valor)}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
}
