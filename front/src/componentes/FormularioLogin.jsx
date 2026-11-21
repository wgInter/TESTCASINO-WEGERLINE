import { useState } from 'react';
import { supabase } from '../supabase';

export default function FormularioLogin({ modoInicial = 'login' }) {
  const [modo, setModo] = useState(modoInicial);
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [enviando, setEnviando] = useState(false);

  const esLogin = modo === 'login';

  const enviar = async () => {
    setEnviando(true);
    setMensaje(null);
    try {
      const { data, error } = esLogin
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password: clave })
        : await supabase.auth.signUp({ email: email.trim(), password: clave });
      if (error) throw error;

      if (!esLogin && !data.session) {
        setMensaje({ tipo: 'ok', texto: 'Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.' });
      }
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.message || 'Error de autenticación.' });
    } finally {
      setEnviando(false);
    }
  };

  const cambiarModo = () => { setModo(esLogin ? 'signup' : 'login'); setMensaje(null); };

  return (
    <section className="login">
      <h2>{esLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
      <p className="aviso">
        {esLogin ? 'Entra con tu correo y contraseña.' : 'Regístrate con tu correo y una contraseña.'}
      </p>
      <label className="campo">
        Correo
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="campo">
        Contraseña
        <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} />
      </label>
      <button type="button" className="boton" disabled={enviando || !email || !clave} onClick={enviar}>
        {enviando ? 'Enviando…' : esLogin ? 'Entrar' : 'Registrarme'}
      </button>
      {mensaje && <p className={`aviso ${mensaje.tipo === 'error' ? 'aviso--error' : 'aviso--ok'}`}>{mensaje.texto}</p>}
      <p className="aviso">
        {esLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
        <a href="#" onClick={(e) => { e.preventDefault(); cambiarModo(); }} style={{ color: 'var(--accent-green)' }}>
          {esLogin ? 'Regístrate' : 'Inicia sesión'}
        </a>
      </p>
    </section>
  );
}
