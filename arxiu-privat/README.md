# Arxiu Històric Penya — gestor editorial privat

Espai de treball **independent** de la web i l'app pública Sempre Penya. Només fitxers dins de `arxiu-privat/`; cap canvi a radars, feed, APK, Supabase públic o pàgina d'inici.

## Accés

- URL: `https://semprepenya.cat/arxiu-privat/` (sense enllaç a la navegació pública).
- Supabase exclusiu: `lfmudiewyupfvtmlgpse`.
- Autenticació amb correu i **contrasenya**; la sessió es conserva mentre sigui vàlida. Recuperació de contrasenya disponible.
- La web estàtica és accessible per URL; **la privacitat de les dades depèn de l'autenticació, les polítiques RLS i els permisos SQL**, no de l'URL oculta.
- Només clau `publishable` al client, cap `service_role` ni secret.

## Dades que es conserven intactes

Les taules `archive_calendar_baseline` (1.321), `archive_proposals` (156), `archive_people` (377), `archive_reference_catalogue` (7.003), `archive_sources` (136), `archive_chapters` (101), `archive_dossiers` (11) i `archive_doubts` (33) conserven les dades originals. Les decisions es guarden en taules/camps editorials separats.

**Mai no s'esborra un registre per descartar-lo.** Una fusió o una decisió de contrast no implica publicar-lo ni modificar-ne l'original.

## Navegació v2

1. **Safata de revisió:** vista SQL `archive_review_queue` amb calendari inicial, propostes del llibre/dossiers i aportacions manuals. Cerca, filtres per origen, estat, mes, prioritat, tipus, font i criteri original; navegació de 30 en 30. Quan es desa una decisió, continua amb el següent pendent.
2. **Calendari original:** conserva la vista íntegra de les 1.321 entrades i ara també permet revisió editorial independent.
3. **Calendari validat:** vista `archive_validated_calendar`, exclusivament decisions explícites de conservar/corregir o incorporacions aprovades amb dia i mes. Exclou automàticament possibles duplicats i propostes ja vinculades a registres existents. Inclou exportació CSV, amb protecció contra fórmules de full de càlcul.
4. **Cerca transversal:** cerca de títols a 9.138 registres entre calendari, propostes, persones, fonts, capítols, dossiers, dubtes i catàleg. La vista SQL `archive_global_search` respecta RLS.
5. **Persones:** fitxes i decisions independents incloure/excloure/contrastar (nova `archive_people_reviews`), notes i relacions verificables amb efemèrides (nova `archive_person_event_links`). Coincidències per text presentades únicament com a suggeriments.
6. **Biblioteca i fonts:** fonts, capítols, dossiers i catàleg de consulta; referències a propostes i notes.
7. **Seguiment:** dubtes i historial de decisions automatitzat `archive_change_log`.
8. **Nova proposta:** crear aportacions pròpies. No passen automàticament al Calendari validat.

## Decisions i regles

- Calendari original: **Conservar / Corregir / Descartar / Fusionar / Contrastar**. Corregir permet proposar títol, tipus, any i data, sense sobreescriure l'original. Fusionar exigeix indicar un altre ID de calendari.
- Propostes documentals i manuals: **Acceptar incorporació / Ampliar registre existent / Corregir registre existent / Descartar proposta / Demanar contrast**. Ampliar o corregir requereix vincular amb el calendari. Acceptar sense data queda en estat `Sense data`, fora del validat.
- Les propostes classificades com a duplicades no s'incorporen al calendari validat per una simple acceptació; cal contrastar o vincular.
- Persones: decisions `Incloure / Excloure / Contrastar`, independents de les efemèrides; no es generen aniversaris automàticament.
- Descartar, fusionar o demanar contrast exigeix una justificació. Les notes addicionals són append-only.
- Les coincidències automàtiques no es confirmen soles.

## Seguretat i auditoria

- Totes les taules exposades tenen RLS. Les noves vistes SQL porten `security_invoker=true` i només `authenticated` té SELECT; a més, les RLS requereixen la pertinença a `archive_members`.
- Els rols `owner`/`editor` poden desar decisions, notes i relacions; `reader` només consulta.
- No hi ha concessions UPDATE sobre el contingut original del calendari, catàleg, capítols o persones.
- Les revisions disposen de control de versió per evitar sobreescriptura concurrent.
- L'historial utilitza triggers preexistents i només amplia els que faltaven; sense duplicació.
- El Supabase de Sempre Penya públic és un projecte diferent i no s'ha tocat.

## Migracions v2

Els fitxers `migrations/20261111_archive_workflow_v2.sql`, `migrations/20261111_remove_duplicate_triggers.sql`  , `migrations/20261111_archive_person_review_links.sql` , `migrations/20261111_notes_dossier_kind.sql`, `migrations/20261111_manual_duplicate_guard.sql` i `migrations/20261111_archive_global_search.sql` documenten els canvis. Les migracions ja s'han aplicat al projecte històric; **no tornar-les a executar manualment sobre el mateix projecte**.

## Verificacions executades

- Nivell SQL: 1.321 originals, 156 propostes, 1.477 elements a la Safata, zero decisions originals alterades i Calendari validat inicialment buit. Cerca transversal de 9.138 registres, sense accés per a no membres.
- Nivell de permisos: usuaris aliens i anònims sense accés; concessions de columna editorials, originals inalterables.
- Nivell d'escriptura: inserir/actualitzar revisions i vinculacions, registrar historial, gestionar casos de data absent i duplicats. Proves fetes en transaccions **ROLLBACK**, cap decisió de prova persistent.
- Nivell de JavaScript: comprovació de sintaxi de tots els fitxers, simulació de l'arrencada, sessió d'owner, estadístiques i navegació entre vistes.
- **Pendent de verificar en navegador real:** desament d'una decisió i d'una nota, cercadors de relacions, enllaços de persones, exportació CSV i comprovació visual de la pàgina.

## Publicació i retorn segur

La branca `feature/arxiu-workflow-v2` conté només fitxers de `arxiu-privat/`. L'historial Git permet recuperar el fitxer de la versió anterior si cal. No hi ha publicació al feed ni a la web pública de les efemèrides aprovades.

La recomanació és provar primer amb el compte `owner` i un registre real però de forma controlada. Si s'aplica una decisió errònia, es pot corregir amb l'historial sense perdre l'original.

## Seguiment de seguretat

El comprovador de Supabase avisa que la protecció contra contrasenyes filtrades està desactivada al projecte històric (`auth_leaked_password_protection`). Es pot activar a la configuració d'Auth, independentment de l'app pública.

## Millores: materials annexos i paginació numèrica (11/11/2026)

### Materials de recerca per a qualsevol fitxa

- Una nova secció **Materials i fonts de recerca** apareix a les fitxes de Calendari, Propostes, Persones, Fonts, Capítols, Dossiers, Dubtes i Catàleg. No exigeix cap decisió editorial.
- Es poden afegir **enllaços HTTPS**, **referències bibliogràfiques sense URL** i **fitxers privats** (PDF, imatges, Word i TXT; màxim 20 MB per fitxer).
- Cada material inclou títol, autor/procedència, notes, data d'incorporació i vinculació amb la fitxa concreta.
- Els fitxers utilitzen el bucket existent `arxiu-historic-privat` (**public=false**, amb RLS); no se n'exposen URL públiques. Per obrir un document, s'emet una URL signada temporal de 120 segons.
- Només `owner`/`editor` poden incorporar o arxivar materials; la consulta es limita als membres `archive_members`. L'arxivament és reversible i deixa rastre, sense eliminar originals ni fitxers.
- En cas de fallar la inserció de metadades després de pujar un document, es prova d'eliminar el fitxer que ha quedat solt en el mateix directori `<uuid>/research/`.
- No s'afegeix res al Calendari validat ni es modifica la decisió editorial en desar una font.
- Migracions aplicades exclusivament al projecte històric: `migrations/20261111_research_materials.sql` i `migrations/20261111_research_materials_privilege_hardening.sql`. No executar-les una segona vegada sobre el projecte existent.

### Paginació

- A tots els llistats paginats es mostra `Pàgina X de Y`, números de pàgina, primera, última, anterior/següent, salts de 10 i un camp per anar a qualsevol número de pàgina.
- Les cerques i els filtres continuen determinat el total de pàgines i els registres es carreguen per blocs de 30, sense carregar les 7.003 entrades del catàleg d'una sola vegada.

### Comprovacions

- Alta d'enllaç i arxivament/registre d'historial provats en una transacció **ROLLBACK**, amb el calendari i les decisions intactes.
- RLS restringeix la lectura als membres; concessions per defecte de SQL endurides: `anon` sense SELECT/INSERT; `authenticated` amb SELECT/INSERT, però UPDATE únicament de l'estat d'arxivament.
- Simulació del formulari d'enllaç: crea material de recerca amb autoria i notes sense enviar cap camp de decisió editorial.
- Simulació de la paginació: amb 1.477 registres, 50 pàgines; primera/última, anada a pàgina 17 i salt a 27 funcionen.
- **Pendent d'una prova real al navegador:** pujada i obertura de fitxers privats i presentació visual final de tots els apartats.

## Fonts unificades i documents originals (11/11/2026 — millora de la sessió)

- Cada fitxa —a la Safata, al Calendari, a Persones, a Propostes o a Biblioteca— obre **la mateixa vista completa** amb l'apartat `Fonts i documents de la fitxa`, independent de qualsevol decisió editorial.
- L'apartat mostra l'enllaç de procedència, les referències documentals importades, capítols del llibre relacionats, documents originals i materials de recerca afegits. Les possibles relacions de propostes no verificades es mostren clarament com a **pendents de contrast**.
- Els materials marcats com a `archived_at` **es mostren per defecte**, amb una etiqueta que indica que es van ocultar anteriorment. `Oculta` substitueix l'antic `Arxiva`: ocultar no esborrarà res. A cada desament es confirma la persistència al servidor i s'actualitza automàticament la llista, sense alterar `archive_calendar_reviews`.
- Els PDF i les imatges que **ja tenen un fitxer a Supabase Storage** poden visualitzar-se dins la fitxa amb accés temporal signat. Els Word i altres documents es descarreguen amb autenticació, sense fer-los públics.
- **Verificació d'inventari abans de publicar:** hi ha 136 fonts originals inventariades (117 PDF, 1 DOCX i 18 fotografies/imatges). **0 d'aquestes fonts tenen `storage_path` i 0 objectes originals hi havia al bucket privat** en fer la comprovació. Per tant, NO es pot afirmar que els originals es puguin obrir avui fins a traspassar-ne els bytes reals.
- Quan es disposi del fitxer original, el formulari del registre documental permet adjuntar-lo al bucket privat i **només el vincula si el SHA-256 i la mida coincideixen amb el registre inventariat**. Això evita substituir erròniament l'original. El camp `storage_path` només es pot establir una vegada, amb RLS d'editor i auditoria. Migració: `migrations/20261111_link_original_documents.sql`.
- El fitxer que existia a la Biblioteca personal de ChatGPT NO és per si mateix un fitxer a Supabase Storage: les eines disponibles no han permès traslladar automàticament en massa els bytes originals.
- Cap canvi al Supabase públic, feed, radars, Android, pàgina d'inici de Sempre Penya o continguts editorials originals.

**Verificacions SQL:** en una transacció `ROLLBACK`, un editor autenticat ha pogut vincular una ruta original amb auditoria. Després de desfer-la, les 136 fonts continuen sense `storage_path`.
**Verificacions JS:** els mòduls tenen sintaxi vàlida i s'ha simulat una fitxa amb l'enllaç original i un article de recerca ja arxivat: tots dos apareixen al panell. També s'han comprovat la previsualització del PDF i la descàrrega de Word amb respostes Storage simulades.

**Pendent de comprovació en navegador real:** que la interfície publicada renderitza correctament les fonts i que un fitxer original s'obre després de pujar-lo. No cal modificar dades originals per comprovar la navegació.

## Ajustos d'ergonomia d'escriptori — 12/11/2026

- A les fitxes de revisió, just sota el títol/data/etiquetes, **el requadre verd comença per Decisió editorial** (o Selecció de persones), seguit immediatament de **Fonts i documents de la fitxa**. Les dades originals segueixen consultables a continuació. Una reserva explícita d'espai manté aquest ordre encara que la consulta de fonts sigui asíncrona.
- La llista de l'esquerra ara té **10 registres compactes per pàgina**, sense scroll intern. Cada títol ocupa una línia per augmentar la densitat; el títol íntegre es mostra en passar-hi el cursor i a la fitxa de la dreta. La paginació numèrica existent continua operativa, incloent salts de deu i última pàgina.
- El formulari **Afegeix un material** es presenta plegat d'entrada, amb el control natiu accessible `<details><summary>`. Les fonts ja guardades es continuen mostrant; desplegar el formulari no afecta els materials ni les decisions.
- Modificacions exclusivament d'HTML/JavaScript/CSS dins de `arxiu-privat/`. Cap migració, dada ni canvi al Supabase públic, app, radars o feed.
- Proves: sintaxi dels scripts; renderització simulada de la fitxa amb decisió abans de fonts i dades originals més avall; comptatge 10 per pàgina i formulari tancat per defecte. Pendent comprovació visual final en navegador real.

## Accessos ràpids a la Safata de revisió (12/11/2026)

- Cinc pestanyes just abans dels filtres avançats: **Pendents**, **Validats**, **Descartats**, **En contrast**, **Tots**. Són accessos ràpids al filtre existent `workflow-status`, no un altre sistema de decisions ni de dades.
- Seleccionar-ne una torna a la primera pàgina i carrega la llista filtrada. L'estat actiu queda marcat visualment i amb `aria-pressed` per a accessibilitat.
- Si es canvia l'estat al desplegable anterior, la selecció ràpida també s'actualitza. Els altres filtres (cerca, origen, mes, prioritat, tipus, font) continuen actius.
- «Tots» elimina **només** el filtre d'estat; no elimina els altres criteris que l'usuari hagi introduït.
- Les categories especials del desplegable (Sense data, Vinculat, Fusionat, etc.) continuen accessibles amb el desplegable encara que no tinguin botó ràpid.
- Només apareixen a la `Safata de revisió`; no modifiquen ni el Calendari validat ni les dades històriques originals.
- Prova de comportament: estat per defecte Pendents, selecció Descarts/Tots, reset de pàgina, sincronització manual i evitació de recàrrega repetida, sense error de sintaxi.

## Justificació editorial opcional (12/11/2026)

La justificació/nota de les decisions editorials és **opcional** tant al calendari com a les propostes i a la selecció de persones. Es pot desar `Descartar`, `Contrastar`, `Fusionar` (amb ID de destinació), `Descartar proposta`, `Demanar contrast` o `Excloure` sense escriure cap motiu. El camp continua disponible per afegir-hi informació. **No** es relaxen les comprovacions de destí de fusió, vincle d'ampliació/correcció o camps necessaris per fer una correcció. No cal cap migració SQL: els camps `rationale`/`notes` ja accepten cadena buida. Proves d'escriptura revertides amb ROLLBACK; cap decisió real modificada.
