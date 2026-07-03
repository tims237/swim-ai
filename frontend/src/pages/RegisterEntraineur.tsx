import { useState, FormEvent } from 'react'
import { registerEntraineur } from '../api/api'
import theme from '../theme'

function RegisterEntraineur() {
  const [form, setForm] = useState({
    email: '', mot_de_passe: '', confirm: '',
    nom: '', prenom: '', date_naissance: '', lieu_naissance: '',
    consentement: false,
  })
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [chargement, setChargement] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErreur('')
    if (form.mot_de_passe.length < 8) return setErreur('Le mot de passe doit contenir au moins 8 caractères')
    if (form.mot_de_passe !== form.confirm) return setErreur('Les mots de passe ne correspondent pas')
    if (!form.consentement) return setErreur('Vous devez accepter les conditions')
    setChargement(true)
    try {
      await registerEntraineur({
        email: form.email, mot_de_passe: form.mot_de_passe,
        nom: form.nom, prenom: form.prenom,
        date_naissance: form.date_naissance || undefined,
        lieu_naissance: form.lieu_naissance || undefined,
        consentement_donnees_sante: true,
      })
      setSucces(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setErreur(e.response?.data?.detail ?? 'Erreur lors de l\'inscription')
    } finally {
      setChargement(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: `1px solid ${theme.bordure}`,
    borderRadius: '10px', fontSize: '14px', fontFamily: theme.policeTexte,
    color: theme.texte, background: theme.blanc, outline: 'none', boxSizing: 'border-box',
  }
  const label: React.CSSProperties = { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 600, color: theme.texte }

  if (succes) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.tertiary }}>
      <div style={{ background: theme.blanc, padding: '40px', borderRadius: '20px', width: '420px', textAlign: 'center', border: `1px solid ${theme.bordure}` }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ color: theme.neutral, fontFamily: theme.policeTitre, fontWeight: 800 }}>Compte entraîneur créé !</h2>
        <p style={{ color: theme.texteDoux, marginTop: '8px' }}>
          Votre compte a été créé. Un administrateur doit valider vos droits si nécessaire.
        </p>
        <a href="/" style={{
          display: 'block', marginTop: '24px', padding: '13px',
          background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`,
          color: theme.blanc, borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '15px',
        }}>Se connecter</a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.tertiary, padding: '24px 0' }}>
      <div style={{
        background: theme.blanc, padding: '40px', borderRadius: '20px',
        width: '460px', border: `1px solid ${theme.bordure}`,
        boxShadow: '0 10px 40px rgba(15,23,42,0.08)', fontFamily: theme.policeTexte,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`,
            marginBottom: '14px', fontSize: '28px',
          }}>🧑‍🏫</div>
          <h1 style={{ fontFamily: theme.policeTitre, fontSize: '22px', fontWeight: 800, color: theme.neutral, margin: 0 }}>
            Inscription Entraîneur
          </h1>
          <p style={{ color: theme.texteDoux, fontSize: '13px', marginTop: '6px' }}>Gérez votre équipe et suivez vos nageurs</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={label}>Prénom *</label>
              <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required style={inputStyle} placeholder="Marc" />
            </div>
            <div>
              <label style={label}>Nom *</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={inputStyle} placeholder="Dubois" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={label}>Date de naissance</label>
              <input type="date" value={form.date_naissance} onChange={(e) => setForm({ ...form, date_naissance: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={label}>Lieu de naissance</label>
              <input value={form.lieu_naissance} onChange={(e) => setForm({ ...form, lieu_naissance: e.target.value })} style={inputStyle} placeholder="Paris" />
            </div>
          </div>
          <div>
            <label style={label}>Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={inputStyle} placeholder="marc@swimclub.fr" />
          </div>
          <div>
            <label style={label}>Mot de passe * <span style={{ color: theme.texteDoux, fontWeight: 400 }}>(min. 8 caractères)</span></label>
            <input type="password" value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })} required style={inputStyle} placeholder="••••••••" />
          </div>
          <div>
            <label style={label}>Confirmer le mot de passe *</label>
            <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required style={inputStyle} placeholder="••••••••" />
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px' }}>
            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
              <input type="checkbox" checked={form.consentement} onChange={(e) => setForm({ ...form, consentement: e.target.checked })} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: theme.texte, lineHeight: '1.5' }}>
                J'accepte le traitement des données personnelles des nageurs que je supervise
                conformément au <a href="/legal/privacy" target="_blank" style={{ color: theme.primary }}>RGPD</a>. *
              </span>
            </label>
          </div>

          {erreur && <p style={{ color: theme.danger, fontSize: '13px', textAlign: 'center' }}>{erreur}</p>}

          <button type="submit" disabled={chargement} style={{
            padding: '13px', background: chargement ? '#94A3B8' : `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`,
            color: theme.blanc, border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700, cursor: chargement ? 'not-allowed' : 'pointer',
          }}>
            {chargement ? 'Création...' : 'Créer mon compte entraîneur'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: theme.texteDoux }}>
            Déjà un compte ? <a href="/" style={{ color: theme.primary, fontWeight: 600 }}>Se connecter</a>
          </p>
        </form>
      </div>
    </div>
  )
}

export default RegisterEntraineur
