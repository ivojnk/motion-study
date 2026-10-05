# Duolingo: beloningen en lesritme

Onderzocht op 5 oktober 2026. De bronnen hieronder zijn publicaties van Duolingo zelf. Ze beschrijven hun ontwerp en onderzoek, en vormen geen bewijs dat dezelfde effecten optreden bij deze anatomiequiz.

## Wat bruikbaar is

Duolingo beschrijft een ritme met directe feedback na een oefening, een korte viering van succes en een groter beloningsmoment na een les. De leerling ziet ook de voortgang door het leerpad. Dat past bij de bestaande korte lessen hier: de feedback vertelt wat goed ging, de volgende stap blijft duidelijk en het resultaat toont wat de leerling heeft verdiend. Bron: [The Duolingo Method for App-based Teaching and Learning, 2023, pagina 6](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf).

Duolingo gebruikt een dagelijkse streak om regelmatig oefenen te ondersteunen. De blog over gewoontevorming beschrijft hoe een kleine dagelijkse taak de startdrempel verlaagt en hoe een viering dat moment aantrekkelijker maakt. Dat ondersteunt het zichtbaar maken van de bestaande dagdoelstreak. Het aantal goede antwoorden achter elkaar is hier een aparte succesreeks binnen één les. Bron: [How Duolingo's streak builds habit](https://blog.duolingo.com/how-duolingo-streak-builds-habit/).

Bij streakmijlpalen werkte Duolingo aan begrijpelijke beelden, meer feestelijkheid en de timing van de animatie. Hier nemen we het principe over dat een aantoonbare mijlpaal een kort eigen moment krijgt. De illustraties, personages en animaties blijven van Duolingo. Bron: [Animating the Duolingo Streak](https://blog.duolingo.com/streak-milestone-design-animation/).

De beloning moet de leeractiviteit blijven volgen. Duolingo beschrijft zelf dat aantallen sessies en XP gebruikers naar korte, makkelijke oefeningen kunnen trekken. Hun maatstaf Time Spent Learning Well geeft daarom meer gewicht aan oefenen dat iemand door het leerpad brengt. Dat ondersteunt het behoud van de bestaande 5 XP per goed antwoord en 10 XP voor een afgeronde les. De succesreeks en tussenstukjes leveren geen extra XP op. Bron: [Understanding Duolingo's Time Spent Learning Well Metric](https://blog.duolingo.com/time-spent-learning-well/).

## Toepassing in deze quiz

`lessonMomentum(session)` berekent de actuele en langste succesreeks uit de echte antwoordpogingen. Een fout of overgeslagen vraag stopt de actuele reeks. Een goed beantwoorde herhaling kan een nieuwe reeks opbouwen. De reeks zegt iets over deze oefenronde. Bestaande gespreide herhaling en beheersing blijven verantwoordelijk voor wat iemand heeft geleerd.

`lessonInterlude(session)` biedt maximaal 2 tussenstukjes: halverwege bij lessen met minstens 6 oorspronkelijke vragen, en bij de start van een extra oefenronde. Er verschijnt alleen een scherm op die overgang. Opgeslagen `dismissedInterludes` voorkomen dat hetzelfde tussenstukje terugkomt bij hervatten. Bij minstens 3 goede antwoorden achter elkaar benoemt het eerste scherm het ritme. De andere versie toont hoeveel vragen al gedaan zijn. Het herhaalscherm maakt de tweede kans voorspelbaar.

De verwachting is dat dit de voortgang beter voelbaar maakt. Er is geen meting van dopamine, retentie of leerrendement voor deze quiz uitgevoerd. Een vervolgmeting kan kijken naar afgeronde lessen, terugkeer op een volgende dag en correcte antwoorden bij latere herhaling. Daarmee is te zien of het plezier ook samenvalt met vaker en beter oefenen.

## Controle

De pure helpers hebben geen dependencies en schrijven geen voortgang of XP weg. De 7 gerichte tests controleren succesreeksen, overgeslagen antwoorden, korte en oneven lessen, herhaalovergangen, hervatten, ongeldige sessies en ongewijzigde invoer. UI-beweging hoort kort te blijven en `prefers-reduced-motion` te respecteren.
