# auth/router.py
# Endpoints d'authentification — inscription et connexion
# Ces routes sont publiques — accessibles sans token JWT

# 2. Bibliothèques tierces
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

# Limites par IP pour les routes d'authentification
# Protection contre les attaques brute-force et l'énumération d'emails
limiter = Limiter(key_func=get_remote_address)

# 3. Imports locaux
from app.auth.security import (
    hasher_mot_de_passe,
    verifier_mot_de_passe,
    creer_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.auth.dependencies import get_current_user, get_current_admin
from app.database import get_db
from app.models import Utilisateur
from datetime import datetime, timezone
from app.models import Nageur
from app.schemas import (
    InscriptionSchema,
    InscriptionNageurSchema,
    InscriptionEntraineurSchema,
    TokenSchema,
    UtilisateurResponse,
    ChangeRoleSchema,
    ChangePasswordSchema,
    ResetPasswordAdminSchema
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentification"]
)


# ─────────────────────────────────────────
# ENDPOINTS
# Les schémas (InscriptionSchema, TokenSchema, UtilisateurResponse, ChangeRoleSchema)
# sont importés depuis app/schemas.py — un seul fichier centralise toute la validation
# ─────────────────────────────────────────

@router.post("/register", response_model=UtilisateurResponse, status_code=status.HTTP_201_CREATED)
def inscription(utilisateur: InscriptionSchema, db: Session = Depends(get_db)):
    """
    Crée un nouveau compte utilisateur avec le rôle "nageur".

    - **email**        : adresse email unique
    - **mot_de_passe** : mot de passe en clair (min 8 caractères) — hashé avec bcrypt
    - **nageur_id**    : optionnel — lie le compte à un profil nageur existant

    Le rôle est TOUJOURS "nageur" à l'inscription.
    Seul un admin peut promouvoir un utilisateur via PUT /auth/role/{id}.
    Le mot de passe n'est JAMAIS stocké en clair en base de données.
    """

    # ── 1. Valide la longueur du mot de passe ───
    if len(utilisateur.mot_de_passe) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins 8 caractères"
        )

    # ── 2. Vérifie que l'email n'existe pas déjà ─
    email_existant = db.query(Utilisateur).filter(
        Utilisateur.email == utilisateur.email
    ).first()

    if email_existant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un compte avec l'email {utilisateur.email} existe déjà"
        )

    # ── 3. Hashe le mot de passe avec bcrypt ─────
    # Le mot de passe en clair n'est jamais stocké
    hash_mot_de_passe = hasher_mot_de_passe(utilisateur.mot_de_passe)

    # ── 4. Crée l'utilisateur en base ────────────
    # Le rôle est TOUJOURS "nageur" à l'inscription
    # Seul un admin peut promouvoir un utilisateur (PUT /auth/role)
    nouvel_utilisateur = Utilisateur(
        email        = utilisateur.email,
        mot_de_passe = hash_mot_de_passe,  # hash bcrypt
        role         = "nageur",           # rôle forcé — sécurité
        nageur_id    = utilisateur.nageur_id,
        actif        = True
    )

    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)

    return nouvel_utilisateur


@router.post("/register/nageur", response_model=UtilisateurResponse, status_code=status.HTTP_201_CREATED)
def inscription_nageur(data: InscriptionNageurSchema, db: Session = Depends(get_db)):
    """
    Inscription d'un nageur.
    Crée un compte utilisateur (role=nageur) ET un profil nageur lié automatiquement.

    Champs requis : email, mot_de_passe (min 8 car.), nom, prenom
    Champs optionnels : date_naissance, lieu_naissance, specialite, niveau
    """

    # ── 1. Validation mot de passe ───────────────
    if len(data.mot_de_passe) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins 8 caractères"
        )

    # ── 2. Email unique ───────────────────────────
    if db.query(Utilisateur).filter(Utilisateur.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un compte avec l'email {data.email} existe déjà"
        )

    # ── 3. Vérifie le consentement RGPD ──────────
    if not data.consentement_donnees_sante:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le consentement au traitement des données de santé est obligatoire (RGPD Article 9)"
        )

    # ── 4. Crée le profil nageur ──────────────────
    profil_nageur = Nageur(
        nom            = data.nom,
        prenom         = data.prenom,
        date_naissance = data.date_naissance,
        specialite     = data.specialite,
        niveau         = data.niveau,
    )
    db.add(profil_nageur)
    db.flush()

    # ── 5. Crée le compte utilisateur ────────────
    nouvel_utilisateur = Utilisateur(
        email                      = data.email,
        mot_de_passe               = hasher_mot_de_passe(data.mot_de_passe),
        role                       = "nageur",
        nom                        = data.nom,
        prenom                     = data.prenom,
        date_naissance             = data.date_naissance,
        lieu_naissance             = data.lieu_naissance,
        nageur_id                  = profil_nageur.id,
        actif                      = True,
        consentement_donnees_sante = True,
        date_consentement          = datetime.now(timezone.utc)
    )
    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)

    return nouvel_utilisateur


@router.post("/register/entraineur", response_model=UtilisateurResponse, status_code=status.HTTP_201_CREATED)
def inscription_entraineur(data: InscriptionEntraineurSchema, db: Session = Depends(get_db)):
    """
    Inscription d'un entraîneur.
    Crée un compte utilisateur avec role=entraineur.
    Pas de profil nageur associé — l'entraîneur gère l'équipe, il ne nage pas.

    Champs requis : email, mot_de_passe (min 8 car.), nom, prenom
    Champs optionnels : date_naissance, lieu_naissance
    """

    # ── 1. Validation mot de passe ───────────────
    if len(data.mot_de_passe) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins 8 caractères"
        )

    # ── 2. Email unique ───────────────────────────
    if db.query(Utilisateur).filter(Utilisateur.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un compte avec l'email {data.email} existe déjà"
        )

    # ── 3. Vérifie le consentement RGPD ──────────
    if not data.consentement_donnees_sante:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le consentement au traitement des données personnelles est obligatoire (RGPD)"
        )

    # ── 4. Crée le compte entraîneur ─────────────
    nouvel_utilisateur = Utilisateur(
        email                      = data.email,
        mot_de_passe               = hasher_mot_de_passe(data.mot_de_passe),
        role                       = "entraineur",
        nom                        = data.nom,
        prenom                     = data.prenom,
        date_naissance             = data.date_naissance,
        lieu_naissance             = data.lieu_naissance,
        nageur_id                  = None,
        actif                      = True,
        consentement_donnees_sante = True,
        date_consentement          = datetime.now(timezone.utc)
    )
    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)

    return nouvel_utilisateur


@router.post("/login", response_model=TokenSchema)
@limiter.limit("5/minute")   # max 5 tentatives de connexion par minute par IP
def connexion(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Connecte un utilisateur et retourne un token JWT.

    Utilise le format standard OAuth2 :
    - **username** : adresse email (champ nommé username par convention OAuth2)
    - **password** : mot de passe en clair

    Retourne un token JWT à stocker côté frontend React.
    Ce token doit être envoyé dans le header de chaque requête :
    Authorization: Bearer eyJhbGci...
    """

    # ── 1. Cherche l'utilisateur par email ───────
    # OAuth2PasswordRequestForm utilise "username" par convention
    # mais on l'utilise comme email dans notre projet
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.email == form_data.username
    ).first()

    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # ── 2. Vérifie le mot de passe ───────────────
    if not verifier_mot_de_passe(form_data.password, utilisateur.mot_de_passe):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # ── 3. Vérifie que le compte est actif ───────
    if not utilisateur.actif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé — contactez l'administrateur"
        )

    # ── 4. Génère le token JWT ───────────────────
    # "sub" = subject — identifiant de l'utilisateur
    # "role" = rôle — utilisé par les dépendances pour les permissions
    token = creer_token(
        data={
            "sub"  : str(utilisateur.id),
            "role" : utilisateur.role
        }
    )

    return TokenSchema(
        access_token = token,
        token_type   = "bearer"
    )


@router.get("/me", response_model=UtilisateurResponse)
def get_me(current_user: Utilisateur = Depends(get_current_user)):
    """
    Retourne les informations de l'utilisateur connecté.
    Route protégée — nécessite un token JWT valide.

    Utilisé par le frontend React pour :
    → afficher le profil de l'utilisateur
    → vérifier le rôle pour afficher la bonne interface
       (vue nageur ou vue entraîneur)
    """
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_mon_compte(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Droit à l'effacement — RGPD Article 17.
    Supprime définitivement le compte de l'utilisateur connecté
    ainsi que TOUTES ses données associées :

    → compte utilisateur
    → profil nageur (si role=nageur)
    → toutes ses sessions d'entraînement (CASCADE)
    → toutes ses biométries (CASCADE)
    → toutes ses performances (CASCADE)

    Cette action est irréversible.
    Le token JWT devient immédiatement invalide après suppression.
    """

    nageur_id = current_user.nageur_id
    utilisateur_id = current_user.id

    # On bypasse l'ORM et on laisse PostgreSQL gérer le CASCADE directement.
    # L'ORM SQLAlchemy tente de SET NULL avant suppression, ce qui viole
    # la contrainte NOT NULL de nageur_id dans biometries/sessions/performances.
    # Le SQL brut déclenche le vrai CASCADE défini dans le DDL.
    db.execute(
        __import__("sqlalchemy").text(
            "DELETE FROM utilisateurs WHERE id = :uid"
        ),
        {"uid": utilisateur_id}
    )

    if nageur_id:
        # Ceci déclenche le CASCADE PostgreSQL :
        # nageurs → sessions → performances (CASCADE)
        # nageurs → biometries (CASCADE)
        db.execute(
            __import__("sqlalchemy").text(
                "DELETE FROM nageurs WHERE id = :nid"
            ),
            {"nid": nageur_id}
        )

    db.commit()


# ─────────────────────────────────────────
# ENDPOINTS ADMIN
# ─────────────────────────────────────────

@router.put("/role/{utilisateur_id}", response_model=UtilisateurResponse)
def changer_role(
    utilisateur_id: int,
    data: ChangeRoleSchema,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_admin)
):
    """
    Change le rôle d'un utilisateur.
    Route protégée — réservée aux administrateurs uniquement.

    - **utilisateur_id** : id de l'utilisateur à modifier
    - **role** : nouveau rôle (nageur, entraineur, admin)

    C'est la seule façon d'obtenir un rôle autre que "nageur".
    L'inscription crée toujours un compte avec le rôle "nageur".
    """

    # ── 1. Vérifie que le rôle est valide ────────
    roles_valides = ["nageur", "entraineur", "admin"]
    if data.role not in roles_valides:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rôle invalide — choisir parmi : {roles_valides}"
        )

    # ── 2. Récupère l'utilisateur cible ──────────
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.id == utilisateur_id
    ).first()

    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur avec l'id {utilisateur_id} introuvable"
        )

    # ── 3. Met à jour le rôle ────────────────────
    utilisateur.role = data.role
    db.commit()
    db.refresh(utilisateur)

    return utilisateur


# ─────────────────────────────────────────
# CHANGEMENT DE MOT DE PASSE (utilisateur connecté)
# ─────────────────────────────────────────

@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def changer_mot_de_passe(
    data: ChangePasswordSchema,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Permet à l'utilisateur connecté de changer son propre mot de passe.
    Route protégée — token JWT requis.

    L'utilisateur doit fournir son mot de passe actuel pour confirmer son identité.
    Sans cette vérification, n'importe qui ayant accès à un écran déverrouillé
    pourrait changer le mot de passe à l'insu du propriétaire.

    - **mot_de_passe_actuel** : mot de passe actuel (confirmation d'identité)
    - **nouveau_mot_de_passe** : nouveau mot de passe — min 8 caractères
    """

    # ── 1. Vérifie le mot de passe actuel ────────
    if not verifier_mot_de_passe(data.mot_de_passe_actuel, current_user.mot_de_passe):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mot de passe actuel incorrect"
        )

    # ── 2. Valide le nouveau mot de passe ─────────
    if len(data.nouveau_mot_de_passe) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nouveau mot de passe doit contenir au moins 8 caractères"
        )

    if data.nouveau_mot_de_passe == data.mot_de_passe_actuel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nouveau mot de passe doit être différent de l'ancien"
        )

    # ── 3. Hache et enregistre le nouveau mot de passe ──
    current_user.mot_de_passe = hasher_mot_de_passe(data.nouveau_mot_de_passe)
    db.commit()


# ─────────────────────────────────────────
# RÉINITIALISATION PAR UN ADMIN (mot de passe oublié)
# ─────────────────────────────────────────

@router.post("/reset-password/{utilisateur_id}", status_code=status.HTTP_204_NO_CONTENT)
def reinitialiser_mot_de_passe(
    utilisateur_id: int,
    data: ResetPasswordAdminSchema,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_admin)
):
    """
    Réinitialise le mot de passe d'un utilisateur — admin uniquement.
    Utilisé quand un utilisateur ne peut plus se connecter (mot de passe oublié).

    Workflow recommandé :
    1. L'utilisateur contacte son entraîneur ou l'administrateur
    2. L'admin définit un mot de passe temporaire via cette route
    3. L'admin communique ce mot de passe temporaire à l'utilisateur
    4. L'utilisateur se connecte et change son mot de passe via POST /auth/change-password

    - **utilisateur_id** : id de l'utilisateur concerné
    - **nouveau_mot_de_passe** : mot de passe temporaire — min 8 caractères
    """

    # ── 1. Vérifie que l'utilisateur existe ───────
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.id == utilisateur_id
    ).first()

    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur avec l'id {utilisateur_id} introuvable"
        )

    # ── 2. Valide le nouveau mot de passe ─────────
    if len(data.nouveau_mot_de_passe) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe temporaire doit contenir au moins 8 caractères"
        )

    # ── 3. Hache et enregistre le nouveau mot de passe ──
    utilisateur.mot_de_passe = hasher_mot_de_passe(data.nouveau_mot_de_passe)
    db.commit()