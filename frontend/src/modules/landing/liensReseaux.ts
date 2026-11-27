// Liens courts par réseau social : dslcargo.com/tiktok, /facebook… Chacun affiche l'accueil, mais
// garde sa propre adresse : Vercel Analytics (panneau « Pages ») compte donc à part les visites de
// chaque réseau, même quand l'application (TikTok, WhatsApp…) ne transmet pas le site d'origine.
// À mettre dans les bios et les publications. Ces adresses sont exclues des moteurs de recherche
// (doublons de l'accueil) et absentes du sitemap. Pour un nouveau réseau, l'ajouter ici.
export const LIENS_RESEAUX = ['tiktok', 'facebook', 'instagram', 'whatsapp'] as const;
