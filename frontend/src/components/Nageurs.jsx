// src/components/Nageurs.jsx
// Écran de gestion des nageurs : liste + création + suppression
import { useState, useEffect } from "react";
import api from "../api";

function Nageurs() {
  // État : la liste des nageurs récupérée depuis l'API
  const [nageurs, setNageurs] = useState([]);
  // État : les champs du formulaire de création
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    specialite: "",
    niveau: "",
  });
  // État : message d'erreur éventuel
  const [erreur, setErreur] = useState("");

  // Charge la liste des nageurs depuis l'API
  const chargerNageurs = async () => {
    try {
      const reponse = await api.get("/nageurs/");
      setNageurs(reponse.data);
    } catch (e) {
      setErreur("Impossible de charger les nageurs. Le backend est-il lancé ?");
    }
  };

  // Au premier affichage du composant, on charge les nageurs
  useEffect(() => {
    chargerNageurs();
  }, []);

  // Met à jour le formulaire quand on tape dans un champ
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Envoie le formulaire à l'API pour créer un nageur
  const creerNageur = async () => {
    setErreur("");
    try {
      // On nettoie : les champs optionnels vides deviennent null
      const data = {
        nom: form.nom,
        prenom: form.prenom,
        date_naissance: form.date_naissance || null,
        specialite: form.specialite || null,
        niveau: form.niveau || null,
      };
      await api.post("/nageurs/", data);
      // On réinitialise le formulaire et on recharge la liste
      setForm({ nom: "", prenom: "", date_naissance: "", specialite: "", niveau: "" });
      chargerNageurs();
    } catch (e) {
      // FastAPI renvoie le détail de l'erreur dans e.response.data.detail
      const detail = e.response?.data?.detail;
      setErreur(typeof detail === "string" ? detail : "Erreur lors de la création.");
    }
  };

  // Supprime un nageur par son id
  const supprimerNageur = async (id) => {
    try {
      await api.delete(`/nageurs/${id}`);
      chargerNageurs();
    } catch (e) {
      setErreur("Erreur lors de la suppression.");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1>🏊 Swim AI — Nageurs</h1>

      {/* Formulaire de création */}
      <div style={{ background: "#f2f2f2", padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h2>Ajouter un nageur</h2>
        <input name="nom" placeholder="Nom *" value={form.nom} onChange={handleChange} />
        <input name="prenom" placeholder="Prénom *" value={form.prenom} onChange={handleChange} />
        <input name="date_naissance" type="date" value={form.date_naissance} onChange={handleChange} />
        <input name="specialite" placeholder="Spécialité (ex: 100m crawl)" value={form.specialite} onChange={handleChange} />
        <input name="niveau" placeholder="Niveau (ex: national)" value={form.niveau} onChange={handleChange} />
        <button onClick={creerNageur} disabled={!form.nom || !form.prenom}>
          Ajouter
        </button>
      </div>

      {/* Message d'erreur */}
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      {/* Liste des nageurs */}
      <h2>Liste des nageurs ({nageurs.length})</h2>
      {nageurs.length === 0 ? (
        <p>Aucun nageur pour l'instant.</p>
      ) : (
        <ul>
          {nageurs.map((n) => (
            <li key={n.id} style={{ marginBottom: 8 }}>
              <strong>{n.prenom} {n.nom}</strong>
              {n.specialite && ` — ${n.specialite}`}
              {n.niveau && ` (${n.niveau})`}
              <button onClick={() => supprimerNageur(n.id)} style={{ marginLeft: 12 }}>
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Nageurs;