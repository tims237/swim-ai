# app/services/email.py
# Service d'envoi d'email — Gmail SMTP
#
# Configuration requise dans .env :
#   GMAIL_USER        = votre.adresse@gmail.com
#   GMAIL_APP_PASSWORD = xxxx xxxx xxxx xxxx  (mot de passe d'application Google)
#   FRONTEND_URL      = http://localhost:3000  (URL du frontend React)
#
# Pour obtenir un mot de passe d'application Gmail :
#   1. Compte Google → Sécurité → Validation en 2 étapes (activer)
#   2. Compte Google → Sécurité → Mots de passe des applications
#   3. Générer pour "Messagerie" → copier le code 16 caractères

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


# ─────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────

GMAIL_USER         = os.getenv("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
FRONTEND_URL       = os.getenv("FRONTEND_URL", "http://localhost:3000")

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587   # TLS


# ─────────────────────────────────────────────────────────
# FONCTION D'ENVOI GÉNÉRIQUE
# ─────────────────────────────────────────────────────────

def envoyer_email(destinataire: str, sujet: str, corps_html: str) -> bool:
    """
    Envoie un email via Gmail SMTP.

    Args:
        destinataire : adresse email du destinataire
        sujet        : objet de l'email
        corps_html   : contenu HTML de l'email

    Returns:
        True si l'email a été envoyé avec succès, False sinon
    """
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        # En développement sans config email, on affiche le lien dans les logs
        print(
            f"[EMAIL NON ENVOYÉ] Config Gmail manquante.\n"
            f"  Destinataire : {destinataire}\n"
            f"  Sujet        : {sujet}\n"
            f"  (Configurer GMAIL_USER et GMAIL_APP_PASSWORD dans .env)",
            flush=True
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = sujet
        msg["From"]    = f"Swim AI <{GMAIL_USER}>"
        msg["To"]      = destinataire

        # Version texte brut (fallback si HTML non supporté)
        corps_texte = corps_html.replace("<br>", "\n").replace("</p>", "\n")
        msg.attach(MIMEText(corps_texte, "plain", "utf-8"))
        msg.attach(MIMEText(corps_html, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as serveur:
            serveur.ehlo()
            serveur.starttls()          # chiffrement TLS
            serveur.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            serveur.sendmail(GMAIL_USER, destinataire, msg.as_string())

        return True

    except smtplib.SMTPAuthenticationError:
        print(
            "[ERREUR EMAIL] Authentification Gmail échouée.\n"
            "  Vérifiez GMAIL_USER et GMAIL_APP_PASSWORD dans .env.\n"
            "  Utilisez un mot de passe d'APPLICATION (pas votre mot de passe Gmail).",
            flush=True
        )
        return False

    except Exception as e:
        print(f"[ERREUR EMAIL] {type(e).__name__}: {e}", flush=True)
        return False


# ─────────────────────────────────────────────────────────
# TEMPLATES D'EMAILS
# ─────────────────────────────────────────────────────────

def envoyer_email_reset_password(destinataire: str, prenom: str, token: str) -> bool:
    """
    Envoie l'email de réinitialisation de mot de passe.
    Le lien est valable 30 minutes et à usage unique.

    Args:
        destinataire : email de l'utilisateur
        prenom       : prénom pour personnaliser l'email
        token        : token UUID de réinitialisation
    """
    lien = f"{FRONTEND_URL}/reset-password?token={token}"

    sujet = "Swim AI — Réinitialisation de votre mot de passe"

    corps_html = f"""
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Inter, Arial, sans-serif; background: #f8fafc; padding: 40px 0;">

  <div style="max-width: 520px; margin: 0 auto; background: white;
              border-radius: 16px; border: 1px solid #e2e8f0;
              box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0055FF, #06B6D4);
                padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 800;">
        🏊 Swim AI
      </h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">
        Smart Training Platform
      </p>
    </div>

    <!-- Contenu -->
    <div style="padding: 36px 40px;">

      <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px;">
        Bonjour <strong>{prenom}</strong>,
      </p>

      <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px;">
        Vous avez demandé la réinitialisation de votre mot de passe Swim AI.
        Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.
      </p>

      <!-- Bouton -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{lien}"
           style="display: inline-block; padding: 14px 32px;
                  background: linear-gradient(135deg, #0055FF, #06B6D4);
                  color: white; text-decoration: none; border-radius: 10px;
                  font-size: 15px; font-weight: 700;">
          Réinitialiser mon mot de passe
        </a>
      </div>

      <!-- Avertissement expiration -->
      <div style="background: #fff7ed; border: 1px solid #fed7aa;
                  border-radius: 8px; padding: 14px 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 13px; color: #c2410c;">
          ⏱ Ce lien est valable <strong>30 minutes</strong> et ne peut être
          utilisé qu'<strong>une seule fois</strong>.
        </p>
      </div>

      <!-- Lien texte si bouton ne fonctionne pas -->
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <span style="color: #0055FF; word-break: break-all;">{lien}</span>
      </p>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        Votre mot de passe restera inchangé.
      </p>

    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0;
                padding: 20px 40px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        Swim AI — Smart Training Platform<br>
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>

  </div>
</body>
</html>
"""
    return envoyer_email(destinataire, sujet, corps_html)
