# Arxiu Històric Penya — interfície privada (versió inicial)

Aquesta carpeta **no** s'importa ni s'enllaça des de la pàgina principal de Sempre Penya.
La branca `feature/arxiu-historic-privat` no altera `index.html`, els scripts del feed, la descàrrega de l'APK ni cap radar.

## Autenticació

Projecte Supabase independent: `lfmudiewyupfvtmlgpse`.
La pàgina utilitza exclusivament una **clau pública publishable** i valida sessió + pertinença a `archive_members`. La privacitat de les dades depèn de RLS a Supabase, no del fet d'ocultar el link; el fitxer HTML, un cop publicat a GitHub Pages, serà públic.

**Pas necessari abans de provar l'entrada per email:**

Supabase Dashboard → projecte Arxiu Històric Penya → Authentication → URL Configuration.
Afegir exactament `https://semprepenya.cat/arxiu-privat/` a Redirect URLs. Es pot establir també com a Site URL quan aquesta sigui la destinació principal de l'autenticació de l'arxiu.
No modificar la configuració del Supabase de Sempre Penya.

En producció, cal assegurar que el correu OTP/lligam màgic funcioni i que la redirecció retorni a l'URL final. L'enllaç inicial d'invitació ja va confirmar correctament l'usuari, però `localhost:3000` no és una pàgina vàlida en producció.

## Funcionalitats de la primera fase

- Visualització i cerca paginada del calendari original, propostes, persones, fonts, capítols, dubtes, catàleg i aportacions.
- Fitxes amb dades i enllaç a font original, quan existeix.
- Edició de decisions de propostes i seguiment de dubtes només per a `owner`/`editor`.
- Alta d'aportacions pròpies amb estat pendent, sense modificar el calendari.
- Sense fusió automàtica ni publicació de contingut aprovat al calendari: són fases posteriors.
- Sense modificar directament registres importats de les fonts.

## Verificacions de publicació

1. Confirmar que el PR només afegeix `arxiu-privat/`.
2. Configurar URL de redirecció al projecte Supabase de l'arxiu.
3. Provar inici de sessió i sessió caducada.
4. Provar que un usuari no membre no obté dades.
5. Provar cerca i lectura de totes les seccions.
6. Provar creació de proposta manual i revisió editorial en registre de prova.
7. Confirmar feed, calendari, APK i radars del Sempre Penya sense canvis.

Aquest fitxer no inclou cap clau secreta, contrasenya ni token de servei.

## Proves de seguretat de base de dades (11/11/2026)

Proves de lectura sense modificar registres:

- Sessió simulada amb el UUID del membre `owner`: accés a 1.321 efemèrides i 156 propostes.
- Sessió simulada amb UUID no membre: zero registres visibles a calendari, propostes i membres (RLS).
- Rol `anon`: denegació SQL `permission denied` de SELECT del calendari (sense concessió de lectura).
- Permisos de columna: `authenticated` pot actualitzar `archive_proposals.decision` i `archive_doubts.editorial_notes`, però no `archive_doubts.title`.

Aquestes proves **no** substitueixen una prova de navegador de l'inici de sessió i de les funcionalitats d'edició. No hi ha cap test automatitzat end-to-end ni confirmació d'enviament d'OTP real.

## Limitacions intencionades

- No s'incorporen dades al calendari original automàticament després d'aprovar una proposta.
- Les decisions de revisió són metadades editorials i la seva publicació serà un procés separat.
- Encara cal verificar redirecció d'autenticació abans de fer merge a `main`.
