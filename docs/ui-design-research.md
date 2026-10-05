# MotionStudy UI redesign

5 oktober 2026. De drie agents onderzochten de bestaande UI, visuele referenties en open-source componenten.

De gekozen richting is een anatomisch studieboek: warme papierkleur, donkere tekst, groene acties, serif paginakoppen en dunne lijnen. Vraag- en antwoordtekst blijft in DM Sans. Hoofdstukken vormen een doorlopende inhoudsopgave. De volgende les staat vooraan, met beloningen en dagdoel eronder.

## Referenties en gebruik

| Bron | Toepassing | Gebruik |
| --- | --- | --- |
| [Zajno Design Library](https://dribbble.com/shots/19922284-Design-Library-Concept-Website) | Boekopmaak, typografische hiërarchie, inhoud centraal | Visuele inspiratie |
| [Atelier Meridian](https://dribbble.com/shots/27306724-Museum-Website-Design-Atelier-Meridian) | Asymmetrische kolommen, rustige vlakken en lijnen | Visuele inspiratie |
| [Tabler lists](https://preview.tabler.io/lists.html) | Doorlopende hoofdstuk- en spierlijsten | Eigen CSS, geen broncode overgenomen |
| [Tabler segmented controls](https://preview.tabler.io/segmented-control.html) | Gegroepeerde aanzichten met geselecteerde status | Eigen CSS en bestaande knoppen |
| [Component Gallery](https://component.gallery/) | Vergelijking van interactiepatronen | Onderzoek |
| [BagUI](https://github.com/anelkabag/bag-ui) | Component- en navigatievoorbeelden | Onderzoek, geen React- of Motion-import |

Er zijn geen afbeeldingen, code of lettertypes uit de Dribbble-ontwerpen overgenomen. De bestaande lokale Tabler-iconen blijven onder MIT, DM Sans en Manrope onder SIL OFL. Licentiebestanden blijven in public/licenses. Georgia is een systeemlettertype. Er zijn geen dependencies toegevoegd.

## Schermen

- Leerpad: prominente volgende les, compacte beloningen, uitklapbare hoofdstukken met lesstatus.
- Atlas: grotere modelruimte, lijst van spieren en bediening met geselecteerd aanzicht. Op mobiel staat het model vóór de spierlijst, ook in de documentvolgorde.
- Voortgang en vragenbank: volledige beschikbare breedte zonder extra anatomiekolom.
- Les, resultaat, invoervelden, accountscherm en bronnendialoog: dezelfde kleuren, kleinere afronding en grotere leestekst.

## Verificatie

De actuele lesopbouw wordt tegelijk elders aangepast. Lesaantallen komen uit de bestaande leerlogica. Deze wijziging past de regels voor beoordeling, herhaling en beloningen niet aan.

De actuele tests zijn geslaagd: 119 tests. De productiebouw slaagt. Browsercontroles op 320, 390, 768 en 1280 pixels tonen geen horizontale overflow. Getest: zoeken, toetsenbordfocus, hoofdstukken openen met Space, antwoorden met cijfertoetsen, herladen van feedback, echte atlasselectie, les openen/sluiten en de bronnendialoog. De reduced-motion-instelling schakelt animaties en overgangen uit. Screenshots staan in output/playwright. Fysieke touchapparaten en echte schermlezers zijn niet getest.

De afzonderlijke onderzoeksrapporten staan in ui-audit-agent.md, design-inspiration-agent.md en opensource-ui-agent.md.
