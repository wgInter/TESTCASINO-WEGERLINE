import { useState } from 'react';
import { supabase } from '../../supabase';
import { actualizarNombre } from '../../api';
import { nombreVisible, validarClave } from '../../logica/cuenta';
import { formatearDinero, formatearFechaLarga } from '../../logica/formato';

export default function PerfilUsuario({ token, perfil, onActualizar }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [errorNombre, setErrorNombre] = useState(null);
  const [clave, setClave] = useState('');
  const [mensajeClave, setMensajeClave] = useState(null);

  if (!perfil) return null;
  const visible = nombreVisible(perfil);

  const empezarEdicion = () => { setNombre(visible); setErrorNombre(null); setEditando(true); };

  const guardarNombre = async () => {
    const nuevo = nombre.trim();
    if (!nuevo) return;
    try {
      await actualizarNombre(token, nuevo);
      setEditando(false);
      onActualizar();
    } catch (e) {
      setErrorNombre(e.message);
    }
  };

  const cambiarClave = async () => {
    const error = validarClave(clave);
    if (error) return setMensajeClave({ tipo: 'error', texto: error });
    const { error: e } = await supabase.auth.updateUser({ password: clave });
    if (e) return setMensajeClave({ tipo: 'error', texto: e.message });
    setClave('');
    setMensajeClave({ tipo: 'ok', texto: 'Contraseña actualizada correctamente.' });
  };

  return (
    <>
      <div className="profile-header">
        <div className="profile-avatar">{visible.charAt(0).toUpperCase()}</div>
        <div>
          {editando ? (
            <div className="profile-name-row">
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
              <button type="button" className="btn btn-primary" onClick={guardarNombre}>Guardar</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          ) : (
            <div className="profile-name-row">
              <h2 style={{ margin: 0 }}>{visible}</h2>
              <button type="button" className="btn btn-ghost" onClick={empezarEdicion}>Editar</button>
              {perfil.rol === 'admin' && <span className="profile-badge">ADMIN</span>}
            </div>
          )}
          {errorNombre && <p className="aviso aviso--error">{errorNombre}</p>}
          <div className="profile-meta">{perfil.email}</div>
          {perfil.fecha_registro && (
            <div className="profile-meta">Miembro desde {formatearFechaLarga(perfil.fecha_registro)}</div>
          )}
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat-label">Saldo</div>
          <div className="profile-stat-value">{formatearDinero(perfil.saldo)}</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-label">Estado</div>
          <div className="profile-stat-value">{perfil.estado || 'activo'}</div>
        </div>
      </div>

      <div className="profile-section-title">Cambiar contraseña</div>
      <div className="profile-password-row">
        <input type="password" placeholder="Nueva contraseña" value={clave} onChange={(e) => setClave(e.target.value)} />
        <button type="button" className="btn btn-ghost" onClick={cambiarClave}>Actualizar</button>
      </div>
      {mensajeClave && (
        <p className={`aviso ${mensajeClave.tipo === 'error' ? 'aviso--error' : 'aviso--ok'}`}>{mensajeClave.texto}</p>
      )}
    </>
  );
}
