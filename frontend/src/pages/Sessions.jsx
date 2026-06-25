import { useState, useEffect } from 'react'
import { getSessions, creerSession, getNageurs } from '../api/api'
import theme from '../theme'

function Sessions() {
  const [sessions, setSessions] = useState([])
  const [nageurs, setNageurs] = useState([])
  const [form, setForm] = useState({
    nageur_id: '', date: '', type_seance: '', duree_min: ''
  })
  const [filtreNageur, setFiltreNageur] = useState('') // '' = tous
  const [message, setMessage] = useState('')

  useEffect(() => {
    chargerSessions()
    chargerNageurs()
  }, [])

  const chargerSessions = async () => {
    try {
      const res = await getSessions()
      setSessions(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const chargerNageurs = async () => {
    try {
      const res = await getNageurs()
      setNageurs(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const nomNageur = (id) => {
    const n = nageurs.find(x => x.id === id)
    return n ? `${n.prenom} ${n.nom}` : `Nageur #${id}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await creerSession({
        nageur_id: parseInt(form.nageur_id),
        date: form.date,
        type_seance: form.type_seance || null,
        duree_min: form.duree_min ? parseInt(form.duree_min) : null,
      })
      setMessage('✅ Session créée avec succès !')
      setForm({ nageur_id: '', date: '', type_seance: '', duree_min: '' })
      chargerSessions()
    } catch (err) {
      setMessage('❌ Erreur : ' + (err.response?.data?.detail || 'inconnue'))
    }
  }

  // Sessions filtrées selon le nageur choisi, triées par date décroissante
  const sessionsAffichees = sessions
    .filter(s => !filtreNageur || s.nageur_id === parseInt(filtreNageur))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const carte = {
    background: theme.fondCarte,
    padding: '24px',
    borderRadius: '16px',
    border: `1px solid ${theme.bordure}`,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.06)',
  }

  const champ = {
    padding: '10px 12px', borderRadius: '10px',
    border: `1px solid ${theme.bordure}`, fontSize: '14px',
    fontFamily: theme.policeTexte, color: theme.texte, outline: 'none',
    background: theme.blanc,
  }

  const labelStyle = { fontSize: '13px', color: theme.texteDoux, fontWeight: 600 }

  return (
    <div style={{ fontFamily: theme.policeTexte }}>
      <h1 style={{ fontFamily: theme.policeTitre, color: theme.neutral, marginBottom: '24px', fontSize: '28px', fontWeight: 800 }}>
        Sessions
      </h1>

      {/* Formulaire d'ajout */}
      <div style={{ ...carte, marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontFamily: theme.policeTitre, color: theme.neutral }}>
          Ajouter une session
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={labelStyle}>Nageur *</label>
            <select value={form.nageur_id} onChange={(e) => setForm({ ...form, nageur_id: e.target.value })} required style={{ ...champ, cursor: 'pointer' }}>
              <option value="">Sélectionner...</option>
              {nageurs.map(n => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={labelStyle}>Date *</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required style={champ} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={labelStyle}>Type de séance</label>
            <select value={form.type_seance} onChange={(e) => setForm({ ...form, type_seance: e.target.value })} style={{ ...champ, cursor: 'pointer' }}>
              <option value="">Sélectionner...</option>
              <option value="endurance">Endurance</option>
              <option value="sprint">Sprint</option>
              <option value="technique">Technique</option>
              <option value="récupération">Récupération</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={labelStyle}>Durée (min)</label>
            <input type="number" value={form.duree_min} onChange={(e) => setForm({ ...form, duree_min: e.target.value })} style={{ ...champ, width: '110px' }} />
          </div>
          <button type="submit" style={{
            padding: '11px 24px',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: theme.blanc, border: 'none', borderRadius: '10px',
            cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: theme.policeTexte,
          }}>
            Ajouter
          </button>
        </form>
        {message && (
          <p style={{ marginTop: '14px', fontSize: '14px', fontWeight: 600, color: message.startsWith('✅') ? theme.succes : theme.danger }}>
            {message}
          </p>
        )}
      </div>

      {/* Barre de filtre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Filtrer par nageur :</label>
        <select value={filtreNageur} onChange={(e) => setFiltreNageur(e.target.value)} style={{ ...champ, cursor: 'pointer', minWidth: '220px' }}>
          <option value="">Tous les nageurs</option>
          {nageurs.map(n => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
        </select>
        <span style={{ color: theme.texteDoux, fontSize: '13px' }}>
          {sessionsAffichees.length} session{sessionsAffichees.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste */}
      <div style={{ ...carte, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: theme.tertiary }}>
            <tr>
              {['ID', 'Nageur', 'Date', 'Type', 'Durée'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: theme.texteDoux, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessionsAffichees.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: theme.texteDoux }}>Aucune session</td></tr>
            ) : sessionsAffichees.map(s => (
              <tr key={s.id} style={{ borderTop: `1px solid ${theme.bordure}` }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texteDoux }}>{s.id}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: theme.neutral }}>{nomNageur(s.nageur_id)}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{s.date}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{s.type_seance || '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{s.duree_min ? `${s.duree_min} min` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Sessions