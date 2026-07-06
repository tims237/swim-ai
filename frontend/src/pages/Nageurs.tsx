import { useState, FormEvent, useEffect } from 'react'
import { getNageurs, creerNageur, supprimerNageur } from '../api/api'
import type { Nageur } from '../types'
import { UserCircle, Trophy, Target, Shield, Plus, X, ChevronLeft } from 'lucide-react'
import theme from '../theme'

function Nageurs() {
  const [nageurs,        setNageurs]        = useState<Nageur[]>([])
  const [form,           setForm]           = useState({ nom: '', prenom: '', specialite: '', niveau: '' })
  const [message,        setMessage]        = useState('')
  const [messageOk,      setMessageOk]      = useState(true)
  const [formOuvert,     setFormOuvert]     = useState(false)
  const [nageurSelec,    setNageurSelec]    = useState<Nageur | null>(null)

  useEffect(() => { void charger() }, [])

  const charger = async () => {
    try { setNageurs(await getNageurs()) } catch { /* silencieux */ }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await creerNageur({ ...form, specialite: form.specialite || undefined, niveau: form.niveau || undefined })
      setMessage('Nageur créé avec succès')
      setMessageOk(true)
      setForm({ nom: '', prenom: '', specialite: '', niveau: '' })
      setFormOuvert(false)
      void charger()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setMessage(e.response?.data?.detail ?? 'Erreur inconnue')
      setMessageOk(false)
    }
  }

  const handleSupprimer = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer ${nom} et toutes ses données ?`)) return
    try {
      await supprimerNageur(id)
      if (nageurSelec?.id === id) setNageurSelec(null)
      void charger()
    } catch {
      setMessage('Erreur lors de la suppression')
      setMessageOk(false)
    }
  }

  const champ: React.CSSProperties = {
    padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0',
    fontSize: '14px', color: '#0F172A', outline: 'none', background: '#F8FAFC', width: '100%',
  }

  function Carte({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 24px', ...style }}>
        {children}
      </div>
    )
  }

  function SectionTitre({ children }: { children: React.ReactNode }) {
    return (
      <h3 style={{ fontFamily: theme.policeTitre, fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
        {children}
      </h3>
    )
  }

  const initiales = (n: Nageur) =>
    `${n.prenom?.[0] ?? ''}${n.nom?.[0] ?? ''}`.toUpperCase()

  // ── Vue détail nageur ──────────────────────────────────────────────────────
  if (nageurSelec) {
    return (
      <div style={{ fontFamily: theme.policeTexte, maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <button onClick={() => setNageurSelec(null)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent',
              border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '13px', marginBottom: '6px', padding: 0,
            }}>
              <ChevronLeft size={15} /> Retour à la liste
            </button>
            <h1 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '22px', color: '#0F172A', margin: 0 }}>
              Profil nageur
            </h1>
            <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>
              Fiche athlète et objectifs saison 2025
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>

          {/* Fiche identité */}
          <Carte style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '24px' }}>{initiales(nageurSelec)}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', fontFamily: theme.policeTitre, marginBottom: '12px' }}>
                {nageurSelec.prenom} {nageurSelec.nom}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {[
                  { label: 'Spécialité', valeur: nageurSelec.specialite ?? '—' },
                  { label: 'Niveau',     valeur: nageurSelec.niveau     ?? '—' },
                ].map(({ label, valeur }) => (
                  <div key={label}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>{valeur}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <span style={{ background: '#F0FDF4', color: '#065F46', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', border: '1px solid #BBF7D0' }}>
                  Actif
                </span>
              </div>
            </div>
          </Carte>

          {/* KPI chrono */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              { label: 'Meilleur chrono', valeur: '—', unite: 's', Icon: Trophy,  accent: theme.primary },
              { label: 'Objectif saison', valeur: '—', unite: 's', Icon: Target,  accent: '#10B981' },
              { label: 'Indice de forme', valeur: '—', unite: '/100', Icon: UserCircle, accent: '#8B5CF6' },
              { label: 'Risque blessure', valeur: '—', unite: '%',  Icon: Shield,  accent: '#EF4444' },
            ].map(({ label, valeur, unite, Icon, accent }) => (
              <Carte key={label} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 18px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color={accent} />
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', fontFamily: theme.policeTitre, lineHeight: 1 }}>
                  {valeur}<span style={{ fontSize: '12px', fontWeight: 400, color: '#94A3B8' }}>{unite}</span>
                </div>
              </Carte>
            ))}
          </div>
        </div>

        {/* Records personnels */}
        <Carte style={{ marginBottom: '14px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 14px' }}>
            <SectionTitre>Records personnels</SectionTitre>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                {['Distance', 'Meilleur chrono', 'Date', 'Compétition'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  Aucun record enregistré
                </td>
              </tr>
            </tbody>
          </table>
        </Carte>

        {/* Danger zone */}
        <Carte style={{ border: '1px solid #FECACA', background: '#FFF8F8' }}>
          <SectionTitre>Zone de danger</SectionTitre>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              Supprimer ce nageur et toutes ses données (sessions, biométries, performances).
            </p>
            <button
              onClick={() => handleSupprimer(nageurSelec.id, `${nageurSelec.prenom} ${nageurSelec.nom}`)}
              style={{
                padding: '9px 18px', background: '#EF4444', color: '#fff',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}
            >
              Supprimer ce nageur
            </button>
          </div>
        </Carte>
      </div>
    )
  }

  // ── Vue liste ──────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: theme.policeTexte, maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '22px', color: '#0F172A', margin: 0 }}>
            Nageurs
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>
            {nageurs.length} athlète{nageurs.length !== 1 ? 's' : ''} enregistré{nageurs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setFormOuvert(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '9px 16px', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
          color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
        }}>
          <Plus size={15} /> Ajouter un nageur
        </button>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          marginBottom: '16px', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
          background: messageOk ? '#F0FDF4' : '#FEF2F2',
          color: messageOk ? '#065F46' : '#DC2626',
          border: `1px solid ${messageOk ? '#BBF7D0' : '#FECACA'}`,
        }}>
          {message}
        </div>
      )}

      {/* Grille de cartes nageurs */}
      {nageurs.length === 0 ? (
        <Carte style={{ textAlign: 'center', padding: '60px', border: '1px dashed #E2E8F0' }}>
          <UserCircle size={40} color="#CBD5E1" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', fontWeight: 500, color: '#475569' }}>Aucun nageur enregistré</p>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>Ajoutez votre premier athlète</p>
        </Carte>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {nageurs.map(n => (
            <div
              key={n.id}
              onClick={() => setNageurSelec(n)}
              style={{
                background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px',
                padding: '20px', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,85,255,0.10)'
                ;(e.currentTarget as HTMLDivElement).style.borderColor = theme.primary
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                ;(e.currentTarget as HTMLDivElement).style.borderColor = '#E2E8F0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>{initiales(n)}</span>
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', fontFamily: theme.policeTitre }}>
                    {n.prenom} {n.nom}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                    {n.specialite ?? 'Spécialité non renseignée'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {n.niveau && (
                  <span style={{ background: '#EFF6FF', color: theme.primary, fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px' }}>
                    {n.niveau}
                  </span>
                )}
                <span style={{ background: '#F0FDF4', color: '#065F46', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px' }}>
                  Actif
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ajout nageur */}
      {formOuvert && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }} onClick={() => setFormOuvert(false)}>
          <div style={{
            background: '#FFFFFF', borderRadius: '16px', padding: '28px 32px',
            width: '440px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(15,23,42,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: theme.policeTitre, fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Ajouter un nageur
              </h2>
              <button onClick={() => setFormOuvert(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {([
                  { label: 'Nom *',     key: 'nom',       required: true },
                  { label: 'Prénom *',  key: 'prenom',    required: true },
                  { label: 'Spécialité', key: 'specialite' },
                  { label: 'Niveau',    key: 'niveau' },
                ] as Array<{ label: string; key: keyof typeof form; required?: boolean }>).map(({ label: l, key, required }) => (
                  <div key={key}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>{l}</label>
                    <input
                      value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      required={required}
                      style={champ}
                    />
                  </div>
                ))}
              </div>
              {message && !messageOk && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#FEF2F2', color: '#DC2626' }}>
                  {message}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setFormOuvert(false)} style={{
                  padding: '10px 20px', borderRadius: '8px', border: '1px solid #E2E8F0',
                  background: '#FFFFFF', color: '#475569', cursor: 'pointer', fontSize: '14px',
                }}>
                  Annuler
                </button>
                <button type="submit" style={{
                  padding: '10px 20px', borderRadius: '8px', border: 'none',
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                }}>
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Nageurs