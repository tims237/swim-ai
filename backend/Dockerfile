# Dockerfile
# Image Docker pour le backend FastAPI de Swim AI

# Image de base Python 3.11 slim — légère et suffisante pour FastAPI
FROM python:3.11-slim

# Définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie d'abord requirements.txt — optimise le cache Docker
# Si requirements.txt ne change pas, cette couche est mise en cache
COPY requirements.txt .

# Installe les dépendances Python
# --no-cache-dir : réduit la taille de l'image finale
RUN pip install --no-cache-dir -r requirements.txt

# Copie tout le code du backend dans le conteneur
COPY . .

# Expose le port 8000 — port d'écoute de FastAPI
EXPOSE 8000

# Commande de démarrage — reload pour le développement
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]