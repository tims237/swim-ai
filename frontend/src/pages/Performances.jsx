import { useState, useEffect } from 'react'
import { getNageurs, getSessions, getPerformancesNageur, creerPerformance } from '../api/api'
import theme from '../theme'

function Performances() {
  const [nageurs, setNageurs] = useState([])
  const [sessions, setSessions] = useState([])
  const [performances, setPerformances] = useState([])
  const [form, setForm] = useState({
    nageur_id: '', session_id: '', distance_m: '', temps_s: '', style_nage: '', vitesse_moy: ''
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    chargerNageurs()
  }, [])

  const chargerNageurs = async () => {
    try {
      const res = await getNageurs()
      setNageurs(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const chargerSessions = async (nageur_id) => {
    try {
      const res = await getSessions()
      setSessions(res.data.filter(s => s.nageur_id === parseInt(nageur_id)))
    } catch (err) {
      console.error(err)
    }
  }

  const chargerPerformances = async (nageur_id) => {
    try {
      const res = await getPerformancesNageur(nageur_id)
      setPerformances(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleNageurChange = (e) => {
    const id = e.target.value
    setForm({ ...form, nageur_id: id, session_id: '' })
    if (id) {
      chargerSessions(id)
      chargerPerformances(id)
    } else {
      setSessions([])
      setPerformances([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const distance = parseInt(form.distance_m)
      const temps = parseFloat(form.temps_s)
      const vitesse = distance && temps ? parseFloat((distance / temps).toFixed(2)) : null
      await creerPerformance({
        session_id: parseInt(form.session_id),
        distance_m: distance || null,
        temps_s: temps || null,
        style_nage: form.style_nage || null,
        vitesse_moy: vitesse,
      })
      setMessage('✅ Performance enregistrée !')
      chargerPerformances(form.nageur_id)
    } catch (err) {
      setMessage('❌ Erreur : ' + (err.response?.data?.detail || 'inconnue'))
    }
  }

  const carte = {
    background: theme.fondCarte, padding: '24px', borderRadius: '16px',
    border: `1px solid ${theme.bordure}`,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.06)',
  }
  const champ = {
    padding: '10px 12px', borderRadius: '10px', border: `1px solid ${theme.bordure}`,
    fontSize: '14px', fontFamily: theme.policeTexte, color: theme.texte,
    outline: 'none', background: theme.blanc,
  }
  const labelStyle = { fontSize: '13px', color: theme.texteDoux, fontWeight: 600 }

  return (
    <div style={{ fontFamily: theme.policeTexte }}>
      <h1 style={{ fontFamily: theme.policeTitre, color: theme.neutral, marginBottom: '24px', fontSize: '28px', fontWeight: 800 }}>
        Performances
      </h1>

      {/* Formulaire */}
      <div style={{ ...carte, marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontFamily: theme.policeTitre, color: theme.neutral }}>
          Enregistrer une performance
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={labelStyle}>Nageur *</label>
            <select value={form.nageur_id} onChange={handleNageurChange} required style={{ ...champ, cursor: 'pointer' }}>
              <option value="">Sélectionner...</option>
              {nageurs.map(n => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={labelStyle}>Session *</label>
            <select value={form.session_id} onChange={(e) => setForm({ ...form, session_id: e.target.value })} required style={{ ...champ, cursor: 'pointer' }}>
              <option value="">Sélectionner...</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>#{s.id} — {s.date} ({s.type_seance || 'sans type'})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={labelStyle}>Style de nage</label>
            <select value={form.style_nage} onChange={(e) => setForm({ ...form, style_nage: e.target.value })} style={{ ...champ, cursor: 'pointer' }}>
              <option value="">Sélectionner...</option>
              {['crawl', 'dos', 'brasse', 'papillon', '4 nages'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={labelStyle}>Distance (m)</label>
            <select value={form.distance_m} onChange={(e) => setForm({ ...form, distance_m: e.target.value })} style={{ ...champ, cursor: 'pointer' }}>
              <option value="">Sélectionner...</option>
              {[50, 100, 200, 400, 800, 1500].map(d => <option key={d} value={d}>{d}m</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={labelStyle}>Chrono (secondes)</label>
            <input type="number" step="0.01" value={form.temps_s}
              onChange={(e) => setForm({ ...form, temps_s: e.target.value })}
              style={{ ...champ, width: '130px' }} placeholder="ex: 58.24" />
          </div>
          <button type="submit" style={{
            padding: '11px 24px', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: theme.blanc, border: 'none', borderRadius: '10px', cursor: 'pointer',
            fontSize: '14px', fontWeight: 700, fontFamily: theme.policeTexte,
          }}>
            Enregistrer
          </button>
        </form>
        {message && (
          <p style={{ marginTop: '14px', fontSize: '14px', fontWeight: 600, color: message.startsWith('✅') ? theme.succes : theme.danger }}>
            {message}
          </p>
        )}
      </div>

      {/* Liste */}
      <div style={{ ...carte, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: theme.tertiary }}>
            <tr>
              {['Session', 'Distance', 'Chrono', 'Style', 'Vitesse moy.'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: theme.texteDoux, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {performances.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: theme.texteDoux }}>
                {form.nageur_id ? 'Aucune performance pour ce nageur' : 'Sélectionne un nageur pour voir ses performances'}
              </td></tr>
            ) : performances.map(p => (
              <tr key={p.id} style={{ borderTop: `1px solid ${theme.bordure}` }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texteDoux }}>#{p.session_id}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{p.distance_m ? `${p.distance_m}m` : '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: theme.neutral }}>{p.temps_s ? `${p.temps_s}s` : '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{p.style_nage || '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{p.vitesse_moy ? `${p.vitesse_moy} m/s` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Performances