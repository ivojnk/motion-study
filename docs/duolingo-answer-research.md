# Antwoorden en feedback: lessen van Duolingo

Onderzocht op 5 oktober 2026 voor MotionStudy. De voorstellen hieronder zijn onze toepassing op anatomievragen. Duolingo's eigen productartikelen geven richting, maar bewijzen geen effect op onze gebruikers of hun dopamine.

## Wat de bronnen ondersteunen

- Duolingo gebruikt XP, streaks en mijlpalen om oefenen te stimuleren. De app maakt geluid, haptiek en motiverende berichten instelbaar. Bron: [Duolingo voor beginners](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/).
- Duolingo meldt dat uitleg over de leerwaarde van moeilijkere oefeningen leidde tot meer oefenen, terugkeer en keuze voor moeilijker materiaal. Een tussenstuk moet daarom zeggen wat je straks leert. Bron: [How Difficult Lessons Motivate Learners](https://blog.duolingo.com/duolingo-difficult-exercises/).
- Grammar Lessons bouwen van makkelijk naar moeilijk op. Tips verschijnen na fouten. Duolingo beschrijft minder fouten bij gebruikers die deze aanvullende lessen volgden. Bron: [Grammar Lessons](https://blog.duolingo.com/language-rules-learning-grammar-on-duolingo/).

## Toepassing op de huidige app

Vóór deze wijziging beoordeelde `chooseAnswer()` meerkeuze en binaire vragen meteen. Aanwijsvragen laten al eerst een veranderbare selectie zien. Open antwoorden hebben een controleknop en lange antwoorden een aparte zelfbeoordeling. Trek de meerkeuzevragen gelijk met die bestaande, bewuste bevestiging.

| Fase | Gedrag |
| --- | --- |
| Kiezen | Klikken of toetsen 1–4 selecteert. De keuze krijgt een zichtbare rand en `aria-pressed`. Er verandert nog geen XP of leerprogressie. |
| Controleren | Een knop blijft uitgeschakeld totdat er een keuze is. Je kunt de keuze nog wijzigen. Bevestigen beoordeelt precies één antwoord. |
| Feedback | Toon een icoon, letterlijk goed of fout, het juiste antwoord en bij succes `+5 XP`. Kleur ondersteunt de tekst. Laat de uitleg staan zolang de gebruiker wil. |
| Verder | Een expliciete knop opent de volgende vraag. Na een mijlpaal kan één kort tussenstuk verschijnen met voortgang en de volgende leerstap. |

Behoud de huidige beloning van 5 XP per goed antwoord en de bestaande lesbonus. Koppel enthousiasme aan concrete resultaten, zoals meerdere goede antwoorden achter elkaar of het afronden van een les. Fouten blijven onderdeel van de les en komen terug als begeleide herhaling.

## Randgevallen die de interactie moeten bewaken

- `pendingChoiceSelection = { questionId, index, response }` is tijdelijk. `session.response` betekent uitsluitend een bevestigd antwoord. Navigeren, starten, doorgaan en herladen wissen onbevestigde keuzes.
- Bewaar beoordeelde antwoorden en open tekst zoals nu. Herladen in feedback mag geen extra XP geven. Dubbelklikken en dubbele bevestiging in de opslagwachtrij mogen ook geen extra poging registreren.
- Houd aanwijzen en `confirmPointSelection()` intact. Anonieme antwoordknoppen blijven bruikbaar als alternatief voor tikken op het model. Een niet geladen model blokkeert beoordelen.
- Enter kan buiten invoervelden controleren of verdergaan. Negeer herhaalde `keydown`-events, zodat ingedrukt houden geen feedback overslaat. Respecteer de standaardactivering van een gefocuste knop. Cijfers en Enter in een tekstveld blijven onderdeel van invoer en formulieren. Een textarea behoudt nieuwe regels.
- Lange open antwoorden behouden de stap vergelijken en daarna zelf beoordelen. Het tonen van het voorbeeldantwoord is nog geen goede poging en levert geen XP op.
- Focus gaat na feedback naar Verder en na doorgaan naar de nieuwe vraag. Tekst en status blijven beschikbaar bij `prefers-reduced-motion`. Controleer dit ook met toetsenbord en op een smal scherm.

## Componentkeuze

De [Button-pagina van Component Gallery](https://component.gallery/components/button/) vergelijkt gevestigde componenten en beschrijft de standaardwerking van HTML-knoppen. Voor deze vanilla app volstaan de bestaande `<button>`, `<progress>`, formulier en `role="status"`. Er is geen extra UI-framework nodig. De galerij is alleen als referentie gebruikt, er is geen componentcode overgenomen.

Gebruik de aanwezige Tabler-iconen. [Tabler Icons heeft een MIT-licentie](https://github.com/tabler/tabler-icons/blob/main/LICENSE). Het project bevat al `public/licenses/tabler-LICENSE.txt`. Hergebruik van lokale SVG's voegt geen dependency of externe netwerkvraag toe. Bewaar de bestaande licentievermelding. De overige galerijcomponenten zijn niet geselecteerd of geïmporteerd, zodat er ook geen nieuwe onderhouds- of bundelkosten ontstaan.
