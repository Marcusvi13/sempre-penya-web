/* SEMPRE PENYA · catàleg canònic de motius editorials v2.
 * Compartit pel feed web i les dues revisions des del correu.
 * Les versions natives d'Android antigues poden requerir una APK nova.
 * No inferiu exclusió per categoria/font: aquests motius són CONTEXTUALS.
 */
(function (root) {
  "use strict";
  const data = {
    publish: [
      ["relevant_first_team", "És rellevant per al primer equip"],
      ["new_information", "Aporta informació nova o actualitzada"],
      ["format_value", "El format aporta valor propi (vídeo, àudio, entrevista…)"],
      ["market_followup", "És mercat/rumor i vull seguir-lo"],
      ["other", "Un altre motiu…"]
    ],
    discard: [
      ["duplicate", "Duplicada / ja tenim la mateixa informació"],
      ["prefer_canonical", "Prefereixo la peça canònica o una altra font"],
      ["outdated", "Massa antiga / fora de finestra"],
      ["irrelevant_first_team", "No és rellevant per al primer equip"],
      ["peripheral", "Només té una relació perifèrica amb la Penya"],
      ["low_information", "Aporta massa poca informació"],
      ["promotional", "És massa promocional"],
      ["youth_women_other", "És cantera, femení o un altre equip"],
      ["clickbait", "Titular/clicbait sense prou contingut"],
      ["other", "Un altre motiu…"]
    ]
  };
  for (const choices of Object.values(data)) {
    for (const entry of choices) Object.freeze(entry);
    Object.freeze(choices);
  }
  root.PENYA_EDITORIAL_REASONS = Object.freeze(data);
})(window);
