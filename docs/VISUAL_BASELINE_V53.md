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

Regla general acordada:

- Les fonts destacades utilitzen **logo/avatar oficial rodó**, estil perfil de Twitter/X.
- Diàmetre visual de referència: **30 dp/px** dins del badge de font.
- Les fonts ocasionals o no registrades utilitzen **inicials** com a fallback automàtic.
- No s'han de substituir els logos validats per favicons genèrics ni versions aproximades trobades a internet.
- Quan els PNG aprovats siguin importats a la web, s'han de guardar de forma persistent al repositori i no dependre d'URLs externes que puguin canviar.

Fonts destacades definides:

1. **Penya / Club Joventut Badalona** — escut oficial / compte `@Penya1930`.
2. **ACB / Liga Endesa** — `@ACBCOM`.
3. **Basketball Champions League** — `@BasketballCL`.
4. **Badalona Comunicació** — `@bdncom`.
5. **Esports BDN Comunicació** — `@Esports_bdncom` (avatar diferent del compte general).
6. **L'Esportiu**.
7. **Mundo Deportivo**.
8. **SPORT**.
9. **Gigantes**.
10. **Sobre la Bocina**.
11. **Eurohopes**.

### Històric important

En versions anteriors es van validar recursos propis per ACB, Badalona Comunicació, Esports BDN, L'Esportiu, Mundo Deportivo, SPORT i Sobre la Bocina. També es va acordar que **Badalona Comunicació i Esports BDN no comparteixin avatar**. La versió final de referència és, però, la configuració visual de la v53.

## Principi de manteniment

Abans de canviar cap color, gradient, mida de logo o mapping de font, revisar aquest fitxer. Si una futura versió modifica expressament algun d'aquests elements i queda validada, cal actualitzar primer aquesta baseline amb el número de versió nou i després aplicar el canvi a web/app.

Android v53 no s'ha de modificar com a conseqüència d'aquest document; serveix com a referència visual mentre la web es desenvolupa en paral·lel.
