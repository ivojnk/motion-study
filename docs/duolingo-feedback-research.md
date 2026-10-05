# Feedback en lesritme vanuit Duolingo

Onderzocht op 5 oktober 2026. De bronnen hieronder beschrijven ontwerpprincipes en historische keuzes van Duolingo. Ze bewijzen geen dopamine-effect of leerwinst voor deze anatomiequiz. Het effect van deze toepassing moet blijken uit gebruik van de quiz.

## Wat de officiële bronnen laten zien

| Bron | Bevinding | Toepassing in deze quiz |
| --- | --- | --- |
| [Building character](https://blog.duolingo.com/building-character/) | Duolingo beschrijft een reactie bij een goed antwoord en tussenschermen als beloning voor meerdere goede antwoorden achter elkaar. | Een korte reactie met symbool, duidelijke tekst en verdiende XP. Een moment halverwege, met een extra reactie bij een reeks goede antwoorden. |
| [The Duolingo Method](https://blog.duolingo.com/duolingo-teaching-method/) | Interactieve oefeningen, korte uitleg en kleine lessen vormen onderdeel van de lesaanpak. | Selecteer een antwoord, controleer het en lees de feedback voordat je doorgaat. De gebruiker bepaalt het tempo. |
| [How to use Duolingo](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/) | XP en streaks maken oefenactiviteit zichtbaar. De beschreven productversie heeft ook competitie en harten. | Bestaande XP worden per antwoord zichtbaar, gevolgd door een uitsplitsing aan het eind. Een reeks goede antwoorden binnen een les blijft herkenbaar als iets anders dan de dagelijkse streak. |
| [How user reports improve course content](https://blog.duolingo.com/how-user-reports-improve-course-content/) | De bron beschrijft feedback en de oplossing nadat de gebruiker een antwoord heeft gecontroleerd. | Feedback verschijnt na een expliciete controleactie. Bij een fout staat het juiste antwoord erbij en blijft herhaling mogelijk. |

De keuze om selectie en controle als aparte handelingen aan te bieden is onze vertaling naar deze quiz. Het voorkomt dat één onbedoelde tik meteen als antwoord telt, en maakt ook kiezen met het toetsenbord mogelijk. Bij het aanwijzen in de atlas bestond al een bevestigingsstap. Die blijft bruikbaar voor het bekijken van de gekozen spier.

## Vormgeving

De quiz houdt de bestaande paarse kleur, lettertypen en anatomie-atlas. Een geselecteerd antwoord krijgt een paarse rand en achtergrond. Na controle onderscheiden tekst en een symbool het goede antwoord van een fout, naast de bestaande groene en warme kleuren. De XP staan bij het antwoord dat ze oplevert. Uitleg blijft direct onder die reactie staan.

De lesbalk toont voortgang, de huidige reeks en les-XP. Een tussenmoment gebruikt een bestaand icoon met een korte boodschap, voortgang en een knop om verder te gaan. De animatie duurt maximaal 280 milliseconden, gebruikt alleen transparantie en verplaatsing of schaal, en stopt volledig bij `prefers-reduced-motion`. De gebruiker hoeft geen animatie af te wachten om verder te kunnen.

Op kleine schermen blijft de volgende-knop binnen de vraagkaart aan de onderrand hangen wanneer die kaart wordt gescrold. De knop heeft een eigen achtergrond en ruimte voor de veilige schermrand. De bestaande antwoorden en atlas behouden hun plek in de kaart. Focusdoelen krijgen extra scrollruimte zodat de knop ze niet bedekt. De controles zijn minimaal 44 pixels hoog, de hoofdactie 52 pixels.

## Componenten en licenties

Voor de voortgangsbalk is vooraf de [Component Gallery](https://component.gallery/components/progress-bar/) bekeken. De projectcode gebruikt al het native HTML-element `progress`. Voor deze toepassing volstaan dat element, bestaande knoppen en lokale CSS. Er is geen componentcode uit de gallery overgenomen en geen extra afhankelijkheid toegevoegd.

De bestaande [Tabler Icons](https://tabler.io/icons) sluiten aan op de nieuwe reacties en tussenmomenten. De [upstream MIT-licentie](https://github.com/tabler/tabler-icons/blob/main/LICENSE) is gecontroleerd. Het project bewaart de bijbehorende copyrightvermelding en volledige licentie al in `public/licenses/tabler-LICENSE.txt`. De nieuwe interface hergebruikt lokale SVG-bestanden. Dat vraagt geen nieuwe runtime, externe aanvraag of animatiebibliotheek. Er zijn geen illustraties, geluiden of personages van Duolingo overgenomen.

## Controlepunten

Controleer de volledige les met muis, aanraking en toetsenbord. Selectie moet nog wijzigbaar zijn voordat de gebruiker controleert. Feedback moet de uitkomst ook zonder kleur begrijpelijk maken. De hoofdactie en input moeten een zichtbare focus houden, de XP mogen bij opnieuw laden niet dubbel worden toegekend, en de tussenmomenten mogen een foutantwoord niet onderbreken. Bekijk lange antwoordteksten en de atlas op 320 en 390 pixels breed en test dezelfde route met beperkte beweging.

Meet daarna of gebruikers de controleactie begrijpen en de uitleg lezen. Vergelijk bijvoorbeeld het aandeel afgeronde lessen en fouten op een latere herhaling. Een hogere XP-score op zichzelf toont oefenactiviteit, geen bewezen beheersing.
