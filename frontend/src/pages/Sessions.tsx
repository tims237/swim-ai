import { useState, FormEvent, useEffect } from 'react'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { getSessions, creerSession, modifierSession, getNageurs } from '../api/api'
import type { Session, Nageur, TypeSeance, Utilisateur } from '../types'
import { Calendar, ChevronDown, Plus, X, Clock, Download, FileText, RotateCcw, Pencil } from 'lucide-react'
import jsPDF from 'jspdf'
import theme from '../theme'

const TYPES_SEANCE: TypeSeance[] = ['endurance', 'sprint', 'technique', 'récupération']

const COULEURS_TYPE: Record<TypeSeance, { bg: string; text: string }> = {
  endurance:    { bg: '#EFF6FF', text: theme.primary },
  sprint:       { bg: '#FFF7ED', text: '#F59E0B' },
  technique:    { bg: '#F5F3FF', text: '#8B5CF6' },
  récupération: { bg: '#F0FDF4', text: '#10B981' },
}

interface ExportEntry { nom: string; date: string; format: 'PDF' | 'CSV' | 'JSON'; statut: 'Complété' }

function telecharger(contenu: string, nomFichier: string, type: string) {
  const blob = new Blob([contenu], { type })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = nomFichier; a.click()
  URL.revokeObjectURL(url)
}

function Sessions({ utilisateur }: { utilisateur: Utilisateur }) {
  const estNageur   = utilisateur.role === 'nageur'
  const monNageurId = utilisateur.nageur_id
  const isMobile    = useWindowWidth() < 768

  const [sessions,          setSessions]          = useState<Session[]>([])
  const [nageurs,           setNageurs]           = useState<Nageur[]>([])
  const [filtreNageur,      setFiltreNageur]      = useState('')
  const [message,           setMessage]           = useState('')
  const [messageOk,         setMessageOk]         = useState(true)
  const [formOuvert,        setFormOuvert]        = useState(false)
  const [sessionAModifier,  setSessionAModifier]  = useState<Session | null>(null)
  const [formatExport,      setFormatExport]      = useState<'PDF' | 'CSV' | 'JSON'>('PDF')
  const [typeRapport,       setTypeRapport]       = useState('Toutes les sessions')
  const [periode,           setPeriode]           = useState('Saison 2025')
  const [historiqueExports, setHistoriqueExports] = useState<ExportEntry[]>(() => {
  try {
    const saved = localStorage.getItem('swim_ai_exports')
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
})

  const [form, setForm] = useState({
    nageur_id: estNageur && monNageurId ? String(monNageurId) : '',
    date: '', type_seance: '', duree_min: '',
  })
  const [formEdit, setFormEdit] = useState({ date: '', type_seance: '', duree_min: '' })

  useEffect(() => {
    void chargerSessions()
    if (!estNageur) void chargerNageurs()
  }, [])

  const chargerSessions = async () => {
    try { setSessions(await getSessions()) } catch { /* silencieux */ }
  }

  const chargerNageurs = async () => {
    try { setNageurs(await getNageurs()) } catch { /* silencieux */ }
  }

  const nomNageur = (id: number) => {
    if (estNageur) return `${utilisateur.prenom} ${utilisateur.nom}`
    const n = nageurs.find(x => x.id === id)
    return n ? `${n.prenom} ${n.nom}` : `Nageur #${id}`
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const cibleId = estNageur && monNageurId ? monNageurId : parseInt(form.nageur_id)
    try {
      await creerSession({
        nageur_id:   cibleId,
        date:        form.date,
        type_seance: (form.type_seance as TypeSeance) || null,
        duree_min:   form.duree_min ? parseInt(form.duree_min) : null,
      })
      setMessage('Session créée avec succès')
      setMessageOk(true)
      setForm({ nageur_id: estNageur && monNageurId ? String(monNageurId) : '', date: '', type_seance: '', duree_min: '' })
      setFormOuvert(false)
      void chargerSessions()
    } catch {
      setMessage('Erreur lors de la création')
      setMessageOk(false)
    }
  }

  const ouvrirModification = (s: Session) => {
    setSessionAModifier(s)
    setFormEdit({ date: s.date, type_seance: s.type_seance ?? '', duree_min: s.duree_min ? String(s.duree_min) : '' })
  }

  const handleModifier = async (e: FormEvent) => {
    e.preventDefault()
    if (!sessionAModifier) return
    try {
      await modifierSession(sessionAModifier.id, {
        date:        formEdit.date,
        type_seance: (formEdit.type_seance as TypeSeance) || null,
        duree_min:   formEdit.duree_min ? parseInt(formEdit.duree_min) : null,
      })
      setMessage('Session modifiée avec succès')
      setMessageOk(true)
      setSessionAModifier(null)
      void chargerSessions()
    } catch {
      setMessage('Erreur lors de la modification')
      setMessageOk(false)
    }
  }

  const sessionsAffichees = sessions
    .filter(s => {
      if (estNageur) return s.nageur_id === monNageurId
      return !filtreNageur || s.nageur_id === parseInt(filtreNageur)
    })
    .sort((a, b) => a.date < b.date ? 1 : -1)

  const totalMinutes = sessionsAffichees.reduce((acc, s) => acc + (s.duree_min ?? 0), 0)

  const genererRapport = () => {
    if (sessionsAffichees.length === 0) return
    const now        = new Date().toISOString().slice(0, 10)
    const horodatage = new Date().toLocaleString('fr-FR')
    let nomFichier   = ''

    if (formatExport === 'CSV') {
      const entete = 'ID,Nageur,Date,Type,Durée (min)\n'
      const lignes = sessionsAffichees
        .map(s => `${s.id},"${nomNageur(s.nageur_id)}",${s.date},${s.type_seance ?? ''},${s.duree_min ?? ''}`)
        .join('\n')
      nomFichier = `Sessions_${now}.csv`
      telecharger(entete + lignes, nomFichier, 'text/csv;charset=utf-8;')

    } else if (formatExport === 'JSON') {
      const donnees = sessionsAffichees.map(s => ({
        id: s.id, nageur: nomNageur(s.nageur_id),
        date: s.date, type_seance: s.type_seance, duree_min: s.duree_min,
      }))
      nomFichier = `Sessions_${now}.json`
      telecharger(
        JSON.stringify({ rapport: typeRapport, periode, exporté_le: horodatage, sessions: donnees }, null, 2),
        nomFichier, 'application/json'
      )

    } else {
      // PDF via jsPDF
      const doc = new jsPDF()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('Swim AI — Rapport Sessions', 14, 20)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(`Type : ${typeRapport}`, 14, 30)
      doc.text(`Période : ${periode}`, 14, 37)
      doc.text(`Exporté le : ${horodatage}`, 14, 44)
      doc.text(`Nageur : ${utilisateur.prenom} ${utilisateur.nom}`, 14, 51)

      // Ligne séparatrice
      doc.setDrawColor(200, 200, 200)
      doc.line(14, 56, 196, 56)

      // En-têtes tableau
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      const cols = ['Date', 'Nageur', 'Type', 'Durée (min)']
      const colX = [14, 50, 110, 160]
      cols.forEach((col, i) => doc.text(col, colX[i], 64))

      doc.line(14, 67, 196, 67)

      // Lignes tableau
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      let y = 74
      sessionsAffichees.forEach(s => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(s.date,                            colX[0], y)
        doc.text(nomNageur(s.nageur_id),            colX[1], y)
        doc.text(s.type_seance ?? '—',              colX[2], y)
        doc.text(s.duree_min ? String(s.duree_min) : '—', colX[3], y)
        y += 8
      })

      // Résumé
      y += 6
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(`Total : ${sessionsAffichees.length} sessions — ${totalMinutes} min`, 14, y)

      nomFichier = `Sessions_${now}.pdf`
      doc.save(nomFichier)
    }

    const entry: ExportEntry = { nom: nomFichier, date: horodatage, format: formatExport, statut: 'Complété' }
    setHistoriqueExports(prev => {
  const updated = [entry, ...prev.slice(0, 4)]
  localStorage.setItem('swim_ai_exports', JSON.stringify(updated))
  return updated
})
  }

  const champ: React.CSSProperties = {
    padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0',
    fontSize: '14px', color: '#0F172A', outline: 'none', background: '#FFFFFF', width: '100%',
  }

  function Carte({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', ...style }}>
        {children}
      </div>
    )
  }

  const rapportsRecents = historiqueExports.slice(0, 2)

  return (
    <div style={{ fontFamily: theme.policeTexte, maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '22px', color: '#0F172A', margin: 0 }}>
            {estNageur ? 'Mes sessions' : 'Sessions'}
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>
            Pilotage collectif des nageurs et décisions coach
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!estNageur && (
            <select value={filtreNageur} onChange={e => setFiltreNageur(e.target.value)} style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0',
              fontSize: '13px', background: '#FFFFFF', color: '#0F172A', cursor: 'pointer', outline: 'none',
            }}>
              <option value="">Tous les nageurs</option>
              {nageurs.map(n => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
            </select>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#475569' }}>
            <Calendar size={13} color="#94A3B8" />
            <span>Saison 2025</span>
            <ChevronDown size={12} color="#94A3B8" />
          </div>
          <button onClick={() => setFormOuvert(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          }}>
            <Plus size={15} /> Nouvelle session
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          marginBottom: '16px', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
          background: messageOk ? '#F0FDF4' : '#FEF2F2',
          color:      messageOk ? '#065F46' : '#DC2626',
          border:     `1px solid ${messageOk ? '#BBF7D0' : '#FECACA'}`,
        }}>
          {message}
        </div>
      )}

      {/* Tableau sessions */}
      <Carte style={{ overflow: 'hidden', marginBottom: '28px' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <h3 style={{ fontFamily: theme.policeTitre, fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {sessionsAffichees.length} session{sessionsAffichees.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#F8FAFC' }}>
            <tr>
              {(estNageur
                ? ['Date', 'Type', 'Durée', '']
                : ['Nageur', 'Date', 'Type', 'Durée', '']
              ).map((h, i) => (
                <th key={i} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessionsAffichees.length === 0 ? (
              <tr>
                <td colSpan={estNageur ? 4 : 5} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                  Aucune session enregistrée
                </td>
              </tr>
            ) : sessionsAffichees.map((s, i) => (
              <tr key={s.id} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                {!estNageur && (
                  <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    {nomNageur(s.nageur_id)}
                  </td>
                )}
                <td style={{ padding: '13px 16px', fontSize: '13px', color: '#475569' }}>{s.date}</td>
                <td style={{ padding: '13px 16px' }}>
                  {s.type_seance ? (
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: COULEURS_TYPE[s.type_seance].bg, color: COULEURS_TYPE[s.type_seance].text }}>
                      {s.type_seance}
                    </span>
                  ) : <span style={{ color: '#CBD5E1' }}>—</span>}
                </td>
                <td style={{ padding: '13px 16px', fontSize: '13px', color: '#475569' }}>
                  {s.duree_min ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color="#94A3B8" /> {s.duree_min} min
                    </span>
                  ) : '—'}
                </td>
                <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                  <button onClick={() => ouvrirModification(s)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: '12px', fontWeight: 600 }}>
                    <Pencil size={12} /> Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Carte>

      {/* Rapports & Exportations */}
      <h2 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '20px', color: '#0F172A', margin: '0 0 4px' }}>
        Rapports et Exportations — {utilisateur.prenom} {utilisateur.nom}
      </h2>
      <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 20px' }}>
        Génération de rapports personnalisés et historique des analyses
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '20px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Rapports récents */}
          <Carte style={{ padding: '20px 24px' }}>
            <h3 style={{ fontFamily: theme.policeTitre, fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
              Rapports Récents
            </h3>
            {rapportsRecents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
                <Download size={28} color="#E2E8F0" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', margin: 0 }}>Aucun export encore généré</p>
                <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Utilisez le panneau à droite pour créer votre premier export</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {rapportsRecents.map((r, i) => (
                  <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        background: r.format === 'PDF' ? '#FEF2F2' : r.format === 'CSV' ? '#EFF6FF' : '#F0FDF4',
                        color:      r.format === 'PDF' ? '#DC2626'  : r.format === 'CSV' ? theme.primary : '#065F46',
                        fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                      }}>
                        {r.format}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{r.date.slice(0, 10)}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{r.nom}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{sessionsAffichees.length} sessions · {totalMinutes} min</div>
                    <button onClick={genererRapport} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#FFFFFF', color: '#475569', cursor: 'pointer', fontSize: '13px' }}>
                      <Download size={13} /> Télécharger
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Carte>

          {/* Historique */}
          <Carte style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={14} color="#94A3B8" />
              <h3 style={{ fontFamily: theme.policeTitre, fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Historique des téléchargements
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#F8FAFC' }}>
                <tr>
                  {['Nom du Fichier', 'Date', 'Format', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historiqueExports.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>Aucun téléchargement</td></tr>
                ) : historiqueExports.map((h, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '11px 16px', fontSize: '13px', color: '#0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={13} color="#94A3B8" />
                        <span style={{ fontWeight: 500 }}>{h.nom}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>{h.date}</td>
                    <td style={{ padding: '11px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{h.format}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: '#F0FDF4', color: '#065F46' }}>
                        Complété
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Carte>
        </div>

        {/* Générateur */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Carte style={{ padding: '20px 24px' }}>
            <h3 style={{ fontFamily: theme.policeTitre, fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
              Générer un nouveau rapport
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type de rapport</label>
                <select value={typeRapport} onChange={e => setTypeRapport(e.target.value)} style={champ}>
                  <option>Toutes les sessions</option>
                  <option>Sessions par type</option>
                  <option>Volume d'entraînement</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Période</label>
                <select value={periode} onChange={e => setPeriode(e.target.value)} style={champ}>
                  <option>7 Derniers Jours</option>
                  <option>30 Derniers Jours</option>
                  <option>3 Derniers Mois</option>
                  <option>Saison 2025</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format d'export</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['PDF', 'CSV', 'JSON'] as const).map(f => (
                    <button key={f} onClick={() => setFormatExport(f)} style={{
                      flex: 1, padding: '9px 0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                      border:     formatExport === f ? `2px solid ${theme.primary}` : '1px solid #E2E8F0',
                      background: formatExport === f ? theme.primary : '#FFFFFF',
                      color:      formatExport === f ? '#FFFFFF' : '#475569',
                    }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={genererRapport}
                disabled={sessionsAffichees.length === 0}
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                  background: sessionsAffichees.length === 0 ? '#E2E8F0' : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  color:  sessionsAffichees.length === 0 ? '#94A3B8' : '#fff',
                  fontSize: '14px', fontWeight: 700,
                  cursor: sessionsAffichees.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px',
                }}
              >
                <Download size={15} /> Générer le rapport
              </button>
            </div>
          </Carte>

          <Carte style={{ padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Volume exporté ce mois
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: theme.primary, fontFamily: theme.policeTitre, lineHeight: 1 }}>
              {historiqueExports.length * 12} MB
            </div>
            {historiqueExports.length > 0 && (
              <div style={{ fontSize: '12px', color: '#10B981', marginTop: '6px', fontWeight: 600 }}>
                ↑ {historiqueExports.length * 12}% vs le mois dernier
              </div>
            )}
          </Carte>
        </div>
      </div>

      {/* Modal création */}
      {formOuvert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setFormOuvert(false)}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px 32px', width: '440px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(15,23,42,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: theme.policeTitre, fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Nouvelle session</h2>
              <button onClick={() => setFormOuvert(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!estNageur && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Nageur *</label>
                  <select value={form.nageur_id} onChange={e => setForm({ ...form, nageur_id: e.target.value })} required style={champ}>
                    <option value="">Sélectionner...</option>
                    {nageurs.map(n => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required style={champ} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Type de séance</label>
                  <select value={form.type_seance} onChange={e => setForm({ ...form, type_seance: e.target.value })} style={champ}>
                    <option value="">Sélectionner...</option>
                    {TYPES_SEANCE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Durée (min)</label>
                  <input type="number" value={form.duree_min} onChange={e => setForm({ ...form, duree_min: e.target.value })} style={champ} min={1} max={300} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setFormOuvert(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', cursor: 'pointer', fontSize: '14px' }}>Annuler</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal modification */}
      {sessionAModifier && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setSessionAModifier(null)}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px 32px', width: '440px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(15,23,42,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h2 style={{ fontFamily: theme.policeTitre, fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Modifier la session</h2>
              <button onClick={() => setSessionAModifier(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '20px' }}>Session #{sessionAModifier.id} — {nomNageur(sessionAModifier.nageur_id)}</p>
            <form onSubmit={handleModifier} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Date *</label>
                <input type="date" value={formEdit.date} onChange={e => setFormEdit({ ...formEdit, date: e.target.value })} required style={champ} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Type de séance</label>
                  <select value={formEdit.type_seance} onChange={e => setFormEdit({ ...formEdit, type_seance: e.target.value })} style={champ}>
                    <option value="">Sélectionner...</option>
                    {TYPES_SEANCE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Durée (min)</label>
                  <input type="number" value={formEdit.duree_min} onChange={e => setFormEdit({ ...formEdit, duree_min: e.target.value })} style={champ} min={1} max={300} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setSessionAModifier(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', cursor: 'pointer', fontSize: '14px' }}>Annuler</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sessions