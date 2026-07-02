# routes/legal.py
# Routes RGPD et mentions légales — accessibles sans authentification
# Ces endpoints permettent au frontend d'afficher les textes légaux
# requis avant l'inscription (consentement Article 9 RGPD)

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/legal",
    tags=["Mentions légales & RGPD"]
)


# ─────────────────────────────────────────────────────────
# SCHÉMAS DE RÉPONSE
# ─────────────────────────────────────────────────────────

class PolitiqueConfidentialite(BaseModel):
    titre                     : str
    responsable_traitement    : str
    finalites                 : list[str]
    donnees_collectees        : list[str]
    base_legale               : str
    duree_conservation        : str
    droits_utilisateur        : list[str]
    contact_dpo               : str
    hebergeur                 : str


class MentionsLegales(BaseModel):
    editeur            : str
    directeur_publication : str
    hebergeur          : str
    contact            : str


# ─────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────

@router.get("/privacy", response_model=PolitiqueConfidentialite)
def get_politique_confidentialite():
    """
    Retourne la politique de confidentialité de Swim AI.
    Route publique — affichée avant l'inscription pour recueillir
    le consentement explicite au traitement des données de santé (RGPD Article 9).
    """
    return PolitiqueConfidentialite(
        titre = "Politique de confidentialité — Swim AI",

        responsable_traitement = (
            "Skills4Mind / Équipe projet Swim AI — "
            "[Adresse à compléter] — [Email DPO à compléter]"
        ),

        finalites = [
            "Suivi des performances sportives des nageurs",
            "Calcul d'indicateurs de charge d'entraînement (ACWR)",
            "Détection précoce du surmenage via les données biométriques",
            "Génération de recommandations personnalisées d'entraînement",
            "Gestion des équipes de natation par les entraîneurs",
        ],

        donnees_collectees = [
            "Données d'identité : nom, prénom, date et lieu de naissance",
            "Données de contact : adresse email",
            "Données de santé (Article 9 RGPD) : variabilité cardiaque (HRV), "
            "fréquence cardiaque au repos, heures de sommeil, effort perçu (RPE)",
            "Données sportives : chronos, distances, styles de nage, types de séances",
            "Données de connexion : adresse IP, horodatage des accès (audit RGPD)",
        ],

        base_legale = (
            "Consentement explicite de la personne concernée "
            "(Article 6.1.a et Article 9.2.a du RGPD). "
            "Ce consentement est recueilli lors de l'inscription et peut être "
            "retiré à tout moment via la suppression du compte (DELETE /auth/me)."
        ),

        duree_conservation = (
            "Données personnelles et de santé : durée de l'abonnement actif + 3 ans. "
            "Journaux d'audit : 6 ans (obligation légale Article 30 RGPD). "
            "En cas d'exercice du droit à l'effacement : suppression immédiate "
            "sauf les journaux d'audit conservés pour obligation légale."
        ),

        droits_utilisateur = [
            "Droit d'accès : GET /auth/me — consulter ses données à tout moment",
            "Droit de rectification : PUT /auth/me — modifier ses informations",
            "Droit à l'effacement : DELETE /auth/me — supprimer son compte et toutes ses données",
            "Droit à la portabilité : export CSV disponible (entraîneur)",
            "Droit de retirer le consentement : à tout moment, sans effet rétroactif",
            "Droit de réclamation auprès de la CNIL : www.cnil.fr",
        ],

        contact_dpo = "[Email du DPO à compléter — obligatoire avant mise en production]",

        hebergeur = (
            "En développement : hébergement local (Docker). "
            "En production : hébergeur certifié HDS (Hébergement de Données de Santé) "
            "requis par l'Article L.1111-8 du Code de la Santé Publique français. "
            "Candidats : OVHcloud HDS, Microsoft Azure France Central HDS, "
            "AWS Paris avec addon HDS."
        )
    )


@router.get("/mentions", response_model=MentionsLegales)
def get_mentions_legales():
    """
    Retourne les mentions légales de Swim AI.
    Route publique — requis par la loi française (LCEN Article 6).
    """
    return MentionsLegales(
        editeur = "Skills4Mind — [Adresse à compléter]",
        directeur_publication = "[Nom du directeur de publication à compléter]",
        hebergeur = (
            "En production : hébergeur certifié HDS — à définir avant déploiement. "
            "En développement : hébergement local."
        ),
        contact = "[Email de contact à compléter]"
    )
