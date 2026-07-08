import { useState, FormEvent } from 'react'
import { changerMotDePasse } from '../api/api'
import type { Utilisateur } from '../types'
import { User, Mail, Shield, Key, CheckCircle, AlertCircle } from 'lucide-react'
import theme from '../theme'

function Profil({ utilisateur }: { utilisateur: Utilisateur }) {
  const [form, setForm]       = useState({ actuel: '', nouveau: '', confirmer: '' })
  const [message, setMessage] = useState('')
  const [ok, setOk]           = useState(true)
  const [loading, setLoading] = useState(false)

  const initiales = `${utilisateur.prenom?.[0] ?? ''}${utilisateur.nom?.[0] ?? ''}`.toUpperCase()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.nouveau !== form.confirmer) {
      setMessage('Les mots de passe ne correspondent pas')
      setOk(false)
      return
    }
    if (form.nouveau.length < 6) {
      setMessage('Le mot de passe doit faire au moins 6 caractères')
      setOk(false)
      return
    }
    setLoading(true)
    try {
      await changerMotDePasse(form.actuel, form.nouveau)
      setMessage('Mot de passe modifié avec succès')
      setOk(true)
      setForm({ actuel: '', nouveau: '', confirmer: '' })
    } catch {
      setMessage('Mot de passe actuel incorrect')
      setOk(false)
    } finally {
      setLoading(false)
    }
  }

  const champ: React.CSSProperties = {
    padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0',
    fontSize: '14px', color: '#0F172A', outline: 'none', background: '#F8FAFC', width: '100%',
  }

  function Carte({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', ...style }}>
        {children}
      </div>
    )
  }

  function SectionTitre({ children }: { children: React.ReactNode }) {
    return (
      <h3 style={{ fontFamily: theme.policeTitre, fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>
        {children}
      </h3>
    )
  }

  return (
    <div style={{ fontFamily: theme.policeTexte, maxWidth: '700px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '22px', color: '#0F172A', margin: 0 }}>
          Mon profil
        </h1>
        <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>
          Vos informations personnelles et sécurité du compte
        </p>
      </div>

      {/* Identité */}
      <Carte style={{ padding: '24px', marginBottom: '16px' }}>
        <SectionTitre>Informations du compte</SectionTitre>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '24px' }}>{initiales}</span>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', fontFamily: theme.policeTitre }}>
              {utilisateur.prenom} {utilisateur.nom}
            </div>
            <span style={{
              display: 'inline-block', marginTop: '6px',
              fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: utilisateur.role === 'nageur' ? '#059669' : '#D97706',
              background: utilisateur.role === 'nageur' ? '#D1FAE5' : '#FEF3C7',
              padding: '3px 10px', borderRadius: '20px',
              border: `1px solid ${utilisateur.role === 'nageur' ? '#A7F3D0' : '#FDE68A'}`,
            }}>
              {utilisateur.role}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Prénom',  valeur: utilisateur.prenom, Icon: User },
            { label: 'Nom',     valeur: utilisateur.nom,    Icon: User },
            { label: 'Email',   valeur: utilisateur.email,  Icon: Mail },
            { label: 'Rôle',    valeur: utilisateur.role,   Icon: Shield },
          ].map(({ label, valeur, Icon }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#F8FAFC', borderRadius: '8px' }}>
              <Icon size={15} color="#94A3B8" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>{valeur}</div>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '12px', color: '#94A3B8', margin: '14px 0 0' }}>
          Pour modifier vos informations personnelles, contactez votre administrateur.
        </p>
      </Carte>

      {/* Changer mot de passe */}
      <Carte style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Key size={15} color={theme.primary} />
          </div>
          <SectionTitre>Changer le mot de passe</SectionTitre>
        </div>

        {message && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
            fontSize: '13px', fontWeight: 600,
            background: ok ? '#F0FDF4' : '#FEF2F2',
            color:      ok ? '#065F46' : '#DC2626',
            border:     `1px solid ${ok ? '#BBF7D0' : '#FECACA'}`,
          }}>
            {ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>
              Mot de passe actuel *
            </label>
            <input
              type="password" value={form.actuel}
              onChange={e => setForm({ ...form, actuel: e.target.value })}
              required style={champ} placeholder="••••••••"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>
                Nouveau mot de passe *
              </label>
              <input
                type="password" value={form.nouveau}
                onChange={e => setForm({ ...form, nouveau: e.target.value })}
                required style={champ} placeholder="••••••••"
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>
                Confirmer *
              </label>
              <input
                type="password" value={form.confirmer}
                onChange={e => setForm({ ...form, confirmer: e.target.value })}
                required style={champ} placeholder="••••••••"
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={loading} style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              background: loading ? '#E2E8F0' : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: loading ? '#94A3B8' : '#fff',
              fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Enregistrement…' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </Carte>
    </div>
  )
}

export default Profil