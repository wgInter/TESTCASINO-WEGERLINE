function Boton({ children, alHacerClic, variante = 'primario', cargando = false }) {
  return (
    <button className={`boton boton--${variante}`} onClick={alHacerClic} disabled={cargando}>
      {cargando ? 'Procesando...' : children}
    </button>
  );
}

export default Boton;
