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

## Fase 1: importació massiva dels 136 originals (13/11/2026)

- A **Biblioteca i fonts → Importar originals** hi ha un importador exclusiu de l'Arxiu Històric; permet seleccionar diversos fitxers alhora o una carpeta sencera amb subcarpetes (Chrome/Edge).
- L'inventari existent compta **136 originals**, uns **88,02 MB** en total, amb SHA-256 i mida esperada. Aquest inventari és un registre històric, no una prova que els bytes dels fitxers es trobin a Supabase.
- La **verificació prèvia** es fa dins del navegador de l'editor. Es calcula SHA-256 de cada fitxer i es contrasta amb les mides i empremtes de l'inventari. El nom no s'utilitza com a criteri suficient: una còpia reanomenada amb hash idèntic es pot vincular sense equivocar-la.
- Un cop verificats, el botó **Puja els originals verificats** demana confirmació i carrega els fitxers **un a un** al bucket privat `arxiu-historic-privat` des de l'ordinador de l'editor, amb la sessió Supabase autenticada i RLS; `upsert:false`. No s'afegeixen fitxers ni secrets a GitHub.
- Per a cada original, verifica de nou el hash just abans de pujar-lo, carrega a `<usuari>/archive-sources/<font>/<uuid>-<nom>` i vincula **únicament `archive_sources.storage_path`**, mai el títol, text, SHA-256 ni les decisions editorials.
- Els originals vinculats es comptabilitzen des de la base de dades i **no es tornen a pujar**. Si la càrrega s'interromp, l'usuari pot tornar a seleccionar els fitxers i reprendre només els pendents. Hi ha opció d'aturar després del fitxer actual i un inventari CSV exportable.
- Davant un error de vinculació després de pujar, es comprova si la base de dades ja ha registrat el camí; només es neteja un fitxer temporal quan és segur que no està vinculat. En fallades amb estat desconegut, preval no destruir dades.
- Si se seleccionen PDF, imatges o Word que no coincideixin per SHA-256 i mida amb cap original pendent, s'indiquen com a **sense correspondència** i no es pugen.
- Tot opera al **projecte independent** `lfmudiewyupfvtmlgpse`. Cap migració nova; les polítiques privades d'edició i `archive_sources.storage_path` ja s'havien preparat.
- El 13/11/2026 s'han trobat **81 dels 136 originals** amb coincidència de nom i bytes a la Biblioteca de ChatGPT, però l'accés de materialització de bytes de la Biblioteca no està disponible en aquest entorn; 55 originals més no figuren amb nom i mida coincidents a la Biblioteca accessible. Per això la càrrega real requereix seleccionar la carpeta original des de l'ordinador. No afirmar que els 81 documents són a Supabase.
- Prova de mòdul amb Storage i Supabase simulats: fitxer verificat → pujada → confirmació de camí; document no coincident exclòs del conjunt verificat. **Pendent una prova real amb la sessió autenticada al navegador** per demostrar la recepció i obertura del primer PDF.

### Procediment recomanat per a l'editor

1. Des del PC, desa/descomprimeix en una carpeta els documents originals (PDF, DOCX, JPG). Pots conservar subcarpetes.
2. Entra a `https://semprepenya.cat/arxiu-privat/`, obre **Biblioteca i fonts → Importar originals**.
3. Prem **Carpeta sencera** i selecciona la carpeta arrel; si tens carpetes diferents, pots seleccionar-les successivament.
4. Prem **Comprova integritat SHA-256**. Revisa quants dels 136 originals queden verificats.
5. Prem **Puja els originals verificats** i mantén oberta la pàgina fins que indiqui el final del procés.
6. Torna a **Biblioteca i fonts → Fonts** i obre una font: ha de mostrar el PDF o la descàrrega del Word si està realment pujat.
7. Si queden pendents, exporta l'inventari CSV, recupera els fitxers que falten i repeteix la importació.

## Fonts de 1994 amb PDF alternatiu (13/11/2026)

- Després de la primera importació hi havia **126 originals exactes** pujats i les deu fonts **F-081 a F-090** del *Mundo Deportivo* (21 i 22/04/1994) pendents. No teníem les seves dades binàries per comprovar si eren versions descarregades o exportades de manera diferent.
- Es manté intacta la verificació estricta de l'original **SHA-256 + mida**. Si un PDF seleccionat no coincideix amb el hash inventariat, però porta un **nom inequívoc equivalent** al d'una font pendent i conté capçalera PDF, es proposa com a **versió alternativa**.
- L'usuari ha d'obrir i revisar visualment cada fitxer abans de marcar explícitament la seva confirmació. Un botó diferent, «Puja les versions alternatives revisades», sol·licita una segona confirmació. Mai no es puja una versió alternativa mitjançant el botó habitual d'originals exactes.
- Les versions alternatives es conserven en `public.archive_source_variants` (migració `migrations/20261113_source_pdf_variants.sql`): ID de font, ruta privada, hash i mida reals, nom, data de revisió, editor i nota. Té RLS de membre per lectura i només inserció per editors; no s'atorga UPDATE ni DELETE. Es registra al log d'auditoria.
- L'original importat `archive_sources.original_sha256`, la seva mida i `archive_sources.storage_path` **NO es modifiquen** en aquesta operació. Per això l'inventari distingeix originals exactes, alternatives revisades i registres sense document.
- La fitxa documental permet visualitzar el PDF alternatiu amb la mateixa autenticació i URL temporal privada, indicant clarament que no és la còpia original byte a byte. Si més endavant es recupera el PDF original, es podrà afegir sense perdre la versió alternativa.
- No es desactiva cap política del magatzem ni es publica informació històrica al calendari. **Pendent** comprovació real des del navegador abans de donar la importació per completada.

## Fase 2 — estudi sistemàtic de les fonts (13/11/2026)

### Estat inicial verificat
- **136 documents** al bucket privat: **126 còpies exactes** de l'inventari i **10 versions alternatives** amb empremta pròpia; no barrejar mai les dues categories.
- La biblioteca inclou 156 propostes històriques, 101 capítols del llibre i 33 dubtes documentals previs, que **no es donen per contrastats automàticament**.
- Primer lot de lectura assistida: **8 fonts** (F-001, F-002, F-003, F-004, F-010, F-013, F-017, F-018) en estat **lectura parcial**, amb **15 troballes registrades**. No s'ha marcat cap font «estudiada» o «contrastada» només per haver llegit el text OCR.

### Nou espai de treball
**Biblioteca i fonts → Estudi documental** ofereix una cua de totes les fonts, ordenada per prioritat, amb cerca i filtres d'estat i valor. Cada fitxa presenta l'enllaç privat al document, les notes de lectura, les propostes que citen aquell nom de fitxer i les troballes relacionades.

Els quatre estats de progrés són:
1. **Pendent:** no hi ha revisió documentada; el valor «inventariat» que constava als fulls d'importació no compta com a estudi.
2. **Lectura parcial:** s'ha llegit una part o un text OCR però falta comprovació visual, cobertura de totes les pàgines o contrast.
3. **Estudiat:** s'ha revisat completament el document i se n'han extret les dades rellevants.
4. **Contrastat:** les dades necessàries s'han comparat amb fonts independents i s'han resolt les qüestions pertinents.

Les troballes tenen una descripció, una pàgina/referència, una observació sobre les evidències, una acció pendent, una categoria (pista, contradicció, contrastada o descartada) i una proposta existent opcional. Una font pot contenir diverses troballes. El contingut incorporat per revisió assistida apareix amb etiqueta pròpia.

### Seguretat, dades i criteri editorial
- Taules noves independents: `archive_source_studies` (estats i notes) i `archive_source_findings` (troballes i enllaços a propostes), RLS de lectura per a membres i escriptura per a editors, control de versió en canvis, registre d'auditoria amb `source_id`.
- No es modifiquen `archive_sources`, les empremtes digitals, els originals, els PDF alternatius, els registres del calendari, les decisions editorials ni els radars de Sempre Penya.
- Passar una troballa a «contrastada» no implica aprovar la proposta ni fer aparèixer una efemèride al calendari validat.
- Les primeres fitxes es basen en extracció de text de pàgines de Mundo Deportivo (1980, 1982, 1983 i 2005), susceptible d'errors OCR. El text ha estat llegit, però no és una transcripció diplomàtica validada. Prioritzar el facsímil visual i dates/documentació contemporànies.

### Primeres contradiccions a resoldre
- **DH5-02:** primer partit contra Penya Ni Cinc: Estruch (1983) recorda un 5–3, mentre que el reportatge de 2005 indica 8–3.
- **DH5-04:** adopció de Centre Esportiu Badaloní: articles de 1980 i testimoni de 1983 situen 1933, article de 2005 indica 1932. Altres referències externes arriben a 1935; investigar l'acta/registre i distingir denominació, aprovació d'estatuts i competició.
- **DH5-03:** encàrrec/compra de samarretes verd-i-negres: article de 1980 parla d'onze i el de 2005 diferencia encàrrec d'onze i compra de nou.
- **DH5-01:** reunió fundacional al local de la impremta Lloret (1980) o garatge proper a Roca i Pi (2005).
- **DH5-07/DH5-09/DH5-11:** retrospectiva de 1980 dona 3/07/1948 (La Plana), c. 1952 (coberta) i 30/09/1972 (Ausiàs March), pendents de fonts contemporànies.

### Proves i límits
Validació RLS: només membres poden llegir; editors poden fer INSERT/UPDATE; una actualització amb versió antiga no ha de trepitjar edicions concurrents. Proves SQL amb `ROLLBACK`: canvi d'estat i de troballa, increment automàtic de versió i identificador d'auditoria. Simulació de UI: tres fonts, filtratge de pendents, vista de font amb fitxer alternatiu i troballa vinculada. La verificació **real en navegador** continua pendent; els primers 8 registres i 15 troballes estan **efectivament persistits** al Supabase privat.
