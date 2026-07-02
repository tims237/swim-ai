// theme.ts
// Design system Swim AI — couleurs, polices et styles réutilisables.
// Importer dans chaque composant : import theme from '../theme'

const theme = {
  primary:   '#0055FF',
  secondary: '#06B6D4',
  tertiary:  '#F8FAFC',
  neutral:   '#1E293B',

  blanc:      '#FFFFFF',
  texte:      '#1E293B',
  texteDoux:  '#64748B',
  bordure:    '#E2E8F0',
  fondCarte:  '#FFFFFF',

  succes:  '#16A34A',
  warning: '#EA580C',
  danger:  '#DC2626',

  policeTitre: "'Hanken Grotesk', sans-serif",
  policeTexte: "'Inter', sans-serif",

  carte: {
    background: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
    padding: '20px',
  },
} as const

export type Theme = typeof theme
export default theme
