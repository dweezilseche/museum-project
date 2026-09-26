// The museum API stores art-movement names in French. The whole UI is in
// English, so we translate the movement to English at the data layer — this
// keeps search, the info panel and the artwork detail all consistent.
const MOVEMENTS_EN = {
  "Art nouveau": "Art Nouveau",
  "Baroque espagnol": "Spanish Baroque",
  Cubisme: "Cubism",
  Expressionnisme: "Expressionism",
  "Haute Renaissance": "High Renaissance",
  Impressionnisme: "Impressionism",
  "Néo-impressionnisme": "Neo-Impressionism",
  Néoclassicisme: "Neoclassicism",
  "Post-impressionnisme": "Post-Impressionism",
  "Primitif flamand": "Early Netherlandish",
  Préraphaélisme: "Pre-Raphaelitism",
  "Renaissance flamande": "Flemish Renaissance",
  "Renaissance italienne": "Italian Renaissance",
  Rococo: "Rococo",
  Romantisme: "Romanticism",
  "Romantisme allemand": "German Romanticism",
  "Romantisme anglais": "English Romanticism",
  Réalisme: "Realism",
  "Réalisme américain": "American Realism",
  "Régionalisme américain": "American Regionalism",
  Surréalisme: "Surrealism",
  Tonalisme: "Tonalism",
  "Ukiyo-e": "Ukiyo-e",
  "Âge d'or néerlandais": "Dutch Golden Age",
};

export function translateMovement(movement) {
  if (!movement) return movement;
  return MOVEMENTS_EN[movement] ?? movement;
}
