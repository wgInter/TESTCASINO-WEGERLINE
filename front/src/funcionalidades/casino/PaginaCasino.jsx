import { useState } from 'react';
import Pestanas from '../../componentes/Pestanas';
import Tragamonedas from './Tragamonedas';
import Blackjack from './Blackjack';
import Ruleta from './Ruleta';

const JUEGOS = [
  { valor: 'slot', etiqueta: 'Tragamonedas' },
  { valor: 'blackjack', etiqueta: 'Blackjack' },
  { valor: 'ruleta', etiqueta: 'Ruleta' },
];

export default function PaginaCasino({ sesion, saldo, onActualizarSaldo }) {
  const [juego, setJuego] = useState('slot');
  const token = sesion?.access_token;

  return (
    <section className="casino">
      <h2>🎰 Casino</h2>
      <p className="aviso">Proyecto académico — se juega con fichas de práctica, sin dinero real.</p>
      <div className="casino-tabs">
        <Pestanas opciones={JUEGOS} activa={juego} onCambiar={setJuego} />
      </div>

      {juego === 'slot' && <Tragamonedas token={token} onActualizarSaldo={onActualizarSaldo} />}
      {juego === 'blackjack' && (
        <Blackjack token={token} usuarioId={sesion?.user?.id} onActualizarSaldo={onActualizarSaldo} />
      )}
      {juego === 'ruleta' && (
        <Ruleta token={token} saldo={saldo} onActualizarSaldo={onActualizarSaldo} />
      )}
    </section>
  );
}
