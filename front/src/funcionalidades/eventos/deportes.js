// Claves reales de The Odds API para esta cuenta (las mismas que usa el back).
export const DEPORTES_INICIO = [
  { valor: 'soccer_epl', etiqueta: 'Premier League' },
  { valor: 'basketball_nba', etiqueta: 'NBA' },
  { valor: 'tennis_atp_cincinnati_open', etiqueta: 'Tenis ATP' },
  { valor: 'americanfootball_nfl', etiqueta: 'NFL' },
  { valor: 'mma_mixed_martial_arts', etiqueta: 'MMA' },
];

export const DEPORTES_MAS = [
  { valor: 'basketball_nba', etiqueta: '🏀 Baloncesto' },
  { valor: 'volleyball_nations_league', etiqueta: '🏐 Vóleibol' },
  { valor: 'soccer_usa_nwsl', etiqueta: '⚽ Fútbol Femenino' },
];

// Los eventos se refrescan cada 20 s, igual que el index.html original.
export const INTERVALO_REFRESCO_MS = 20000;

const EMOJIS = {
  soccer_epl: '⚽',
  basketball_nba: '🏀',
  tennis_atp_cincinnati_open: '🎾',
  americanfootball_nfl: '🏈',
  mma_mixed_martial_arts: '🥊',
};
export const emojiDeporte = (clave) => EMOJIS[clave] ?? '🏆';
