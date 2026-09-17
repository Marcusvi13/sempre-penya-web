# SEMPRE PENYA — baseline visual canònic v53

Aquesta és la referència visual que s'ha d'utilitzar per a la web i per a qualsevol reconstrucció futura de la interfície. La versió de referència és **Android v0.6.24 · v53**. No s'han de reconstruir aquests valors de memòria ni substituir-los per aproximacions.

## Capçalera

- Nom: **SEMPRE PENYA**.
- Verd Penya base: **#005441** (RGB 0, 84, 65; Pantone 343).
- Degradat aprovat: **baix-esquerra `#0B6F59` → centre `#005441` → dalt-dreta `#002E24`**.
- Equivalent CSS web: `linear-gradient(45deg, #0B6F59 0%, #005441 52%, #002E24 100%)`.
- L'escut s'ha de mantenir amb el mateix tractament visual de la v53.
- **NO mostrar a la capçalera el recompte del tipus `132 ENLLAÇOS · 90 DIES` ni cap equivalent dinàmic.**
- La informació de retenció sí que pot aparèixer al cos amb el text acordat: **«Es mostren els darrers 90 dies»**.

## Logos / avatars de fonts

### Font canònica dels recursos

Els recursos exactes de la v53 s'han extret directament de l'APK publicat i es conserven a:

- `assets/source-logos/`
- `assets/source-logos/MANIFEST.txt`

El manifest conserva per a cada imatge el nom, mida, SHA-256 i ruta original dins de l'APK. **Aquests fitxers són la font de veritat visual.** No s'han de substituir per favicons, captures o versions aproximades trobades a internet.

La recuperació és reproduïble mitjançant `.github/workflows/recover-v53-source-logos.yml`, que descarrega l'APK publicat, n'extreu els recursos `source_*` / `cjb_logo` i en genera el manifest.

### Recursos presents realment a Android v0.6.24 · v53

1. **Penya / Club Joventut Badalona** — `cjb_logo.png`.
2. **ACB / Liga Endesa** — `source_acbcom.png`.
3. **Basketball Champions League** — `source_basketballcl.png`.
4. **Badalona Comunicació** — `source_bdncom.png`.
5. **Esports BDN Comunicació** — `source_esports_bdncom.png` (recurs diferent del compte general).
6. **Gigantes** — `source_gigantesbasket.png`.
7. **L'Esportiu** — `source_lesportiucat.png`.
8. **Mundo Deportivo** — `source_mundodeportivo.png`.
9. **Sobre la Bocina** — `source_sobrelabocina.png`.
10. **SPORT** — `source_sport.png`.

**Eurohopes no té un recurs `source_*` dins de l'APK v53 extret.** Fins que s'aprovi expressament un logo nou, s'ha de mostrar amb el fallback d'inicials i no amb un avatar improvisat.

### Regla de presentació web

- Les fonts amb recurs validat utilitzen el PNG local corresponent.
- A la web, el badge exterior és de 34 px i el logo/avatar visible és de **30 px, rodó**.
- Les fonts ocasionals o sense recurs validat utilitzen **inicials** com a fallback automàtic.
- El mapping es manté a `source-logos.js` i ha de contemplar variants normals del nom de la font.
- L'ordre de matching és important: **Esports BDN** s'ha de detectar abans que **Badalona Comunicació** perquè tenen avatars diferents.

## Com es va solucionar històricament el problema dels logos

Abans de la v53 ja s'havia produït una pèrdua dels logos. La solució estable es va conservar al commit **`cf701c944567f4d9f228ee3803675fa7842a1c59` — «Conserva SourceBadge i logos exactes de la v22»**:

1. es van recuperar els PNG exactes d'una APK anterior que es veia correctament;
2. es van empaquetar a `assets/v22_source_logos.zip`;
3. l'script de construcció els descomprimia dins `res/drawable`;
4. `SourceBadge` aplicava un mapping explícit per `source_id` / nom de font;
5. si la font no tenia logo validat, es mostraven inicials.

La recuperació actual de v53 aplica el mateix principi, però millorat: **els recursos finals queden extrets de l'APK actual, versionats individualment al repositori i acompanyats d'un manifest criptogràfic**, de manera que no cal tornar a reconstruir-los de memòria.

## Principi de manteniment

Abans de canviar cap color, degradat, mida de logo o mapping de font, revisar aquest fitxer i el `MANIFEST.txt`. Si una futura versió modifica expressament algun d'aquests elements i queda validada, cal actualitzar primer aquesta baseline amb el número de versió nou i després aplicar el canvi a web/app.

Android v53 no s'ha de modificar com a conseqüència d'aquest document; serveix com a referència visual mentre la web es desenvolupa en paral·lel.
