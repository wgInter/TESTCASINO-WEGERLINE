import { etiquetaTransaccion } from '../../logica/cuenta';
import { formatearDinero, formatearFecha } from '../../logica/formato';

export default function ListaMovimientos({ movimientos }) {
  return (
    <div>
      {movimientos.map((t) => {
        const monto = Number(t.monto);
        return (
          <div className="tx-item" key={t.id}>
            <div>
              <div className="tx-tipo">{etiquetaTransaccion(t.tipo)}</div>
              <div className="tx-fecha">{formatearFecha(t.creado_en)}</div>
            </div>
            <div className={`tx-monto ${monto >= 0 ? 'pos' : 'neg'}`}>
              {monto >= 0 ? '+' : ''}{formatearDinero(monto)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
