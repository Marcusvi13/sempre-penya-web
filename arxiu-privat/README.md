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

1. **Safata de revisió:** vista SQL `archive_review_queue` amb calendari inicial, propostes del llibre/dossiers i aportacions manuals. Cerca, filtre per origen, estat, mes i prioritat; navegació de 30 en 30. Quan es desa una decisió, continua amb el següent pendent.
2. **Calendari original:** conserva la vista íntegra de les 1.321 entrades i ara també permet revisió editorial independent.
3. **Calendari validat:** vista `archive_validated_calendar`, exclusivament decisions explícites de conservar/corregir o incorporacions aprovades amb dia i mes. Exclou automàticament possibles duplicats i propostes ja vinculades a registres existents. Inclou exportació CSV, amb protecció contra fórmules de full de càlcul.
4. **Persones:** fitxes i decisions independents incloure/excloure/contrastar (nova `archive_people_reviews`), notes i relacions verificables amb efemèrides (nova `archive_person_event_links`). Coincidències per text presentades únicament com a suggeriments.
5. **Biblioteca i fonts:** fonts, capítols, dossiers i catàleg de consulta; referències a propostes i notes.
6. **Seguiment:** dubtes i historial de decisions automatitzat `archive_change_log`.
7. **Nova proposta:** crear aportacions pròpies. No passen automàticament al Calendari validat.

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

Els fitxers `migrations/20261111_archive_workflow_v2.sql`, `migrations/20261111_remove_duplicate_triggers.sql`  , `migrations/20261111_archive_person_review_links.sql` i `migrations/20261111_notes_dossier_kind.sql` documenten els canvis. Les migracions ja s'han aplicat al projecte històric; **no tornar-les a executar manualment sobre el mateix projecte**.

## Verificacions executades

- Nivell SQL: 1.321 originals, 156 propostes, 1.477 elements a la Safata, zero decisions originals alterades i Calendari validat inicialment buit.
- Nivell de permisos: usuaris aliens i anònims sense accés; concessions de columna editorials, originals inalterables.
- Nivell d'escriptura: inserir/actualitzar revisions i vinculacions, registrar historial, gestionar casos de data absent i duplicats. Proves fetes en transaccions **ROLLBACK**, cap decisió de prova persistent.
- Nivell de JavaScript: comprovació de sintaxi de tots els fitxers, simulació de l'arrencada, sessió d'owner, estadístiques i navegació entre vistes.
- **Pendent de verificar en navegador real:** desament d'una decisió i d'una nota, cercadors de relacions, enllaços de persones, exportació CSV i comprovació visual de la pàgina.

## Publicació i retorn segur

La branca `feature/arxiu-workflow-v2` conté només fitxers de `arxiu-privat/`. L'historial Git permet recuperar el fitxer de la versió anterior si cal. No hi ha publicació al feed ni a la web pública de les efemèrides aprovades.

La recomanació és provar primer amb el compte `owner` i un registre real però de forma controlada. Si s'aplica una decisió errònia, es pot corregir amb l'historial sense perdre l'original.

## Seguiment de seguretat

El comprovador de Supabase avisa que la protecció contra contrasenyes filtrades està desactivada al projecte històric (`auth_leaked_password_protection`). Es pot activar a la configuració d'Auth, independentment de l'app pública.
