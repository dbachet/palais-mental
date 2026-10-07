// ═══════════════════════════════════════════════════════════════
// MENTAL PALACE - Réglages du compte en ligne (Supabase)
// ═══════════════════════════════════════════════════════════════
// Supabase → Project Settings → API. La clé « anon » / « publishable »
// est faite pour être publique : ce sont les règles de la base
// (supabase/schema.sql) qui protègent les données de chaque compte.
// Ne JAMAIS mettre ici la clé « service_role » / « secret ».
//
// Tant que les deux champs sont vides, l'app reste 100 % locale
// et la carte « Compte » de l'espace parents est masquée.

const SUPABASE_CONFIG = {
  url: '',  // ex. 'https://abcdefgh.supabase.co'
  key: ''   // clé anon (eyJ...) ou publishable (sb_publishable_...)
};
