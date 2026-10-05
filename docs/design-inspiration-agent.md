# MotionStudy: onderzoek naar de vormgeving

Onderzocht op 5 oktober 2026. Vier Dribbble-projecten zijn in de browser visueel bekeken. De aanbevelingen zijn ontwerpkeuzes voor MotionStudy, geen bewezen uitspraken over leerresultaten.

De huidige stijl gebruikt bijna overal dezelfde paarse accentkleur, zachte achtergrondvlakken en afgeronde kaarten. Dat maakt dagelijkse oefening, hoofdstukken, atlas, beloningen en instellingen visueel te vergelijkbaar. Een digitale anatomie-atlas geeft het product meer eigen karakter: warme papierkleur, donkere tekst, duidelijke hoofdstuktitels en inhoud die op vaste lijnen staat.

| Voorbeeld | Wat zichtbaar werkt | Toepassing in MotionStudy |
| --- | --- | --- |
| [Design Library, Sophie Tomash / Zajno](https://dribbble.com/shots/19922284-Design-Library-Concept-Website) | Witte boekpagina's, serif koppen, dunne scheidingslijnen, objecten met kleine captions. De maker beschrijft een modulaire grid en inspiratie uit boek- en tijdschriftopmaak. | Atlas als figuur met titel en caption. Hoofdstukken als een leesbare inhoudsopgave. |
| [Atelier Meridian, Phenomenon Studio](https://dribbble.com/shots/27306724-Museum-Website-Design-Atelier-Meridian) | Asymmetrische titel- en tekstkolommen, veel witruimte, horizontale lijnen en nauwelijks kaartcontainers. | Intro met heldere titel links en leercontext rechts. Lesrijen op één gezamenlijke ondergrond. |
| [Modern Art Museum, Nixtio](https://dribbble.com/shots/27001570-Modern-Art-Museum-Website-Exhibition-Landing-Page) | Grote serif typografie, roomkleur en sterke schaalverschillen. Beeld en titel overlappen bewust. | Meer contrast tussen paginatitel, hoofdstuktitel en metadata. De extreme overlap past minder bij het bedienen van een leerapp. |
| [Vintage Technology Archive, Alex Pavlov](https://dribbble.com/shots/27727520-Vintage-Technology-Archive-Website-by-Alex-Pavlov) | Warme papierkleur, vaste rasters, dunne lijnen en labels die bij objecten horen. | Voortgang als overzicht van onderwerpen en aantallen. De sepiafotografie en decoratieve retroletters zijn minder geschikt voor anatomie. |

Een aanvullende anatomiebron is [AnatoXR](https://haizoomdesign.com/projects/anatoxr). De openbare projecttekst beschrijft een combinatie van roteerbare 3D-modellen en gestructureerde cursussen. De browser toont een wachtwoordscherm, daarom zijn de daadwerkelijke interfaces niet visueel geverifieerd. Deze bron ondersteunt alleen het idee om model en leerroute bij elkaar te houden.

## Voorstel voor alle schermen

- Papier `#f5f2eb`, tekst `#202924`, functioneel groen `#245244`, scheidingslijn `#d8dbd1`. Groene accenten markeren actieve acties en voortgang. Rood en groen bij antwoorden houden hun betekenis.
- Serif alleen voor grote paginakoppen en belangrijke hoofdstuktitels. Bestaande DM Sans voor vragen, antwoorden, navigatie en bediening. Dit voorkomt dat lange oefenteksten als een poster gaan lezen.
- Verklein de afronding van grote oppervlakken tot 0–8 px. Gebruik 6–10 px bij buttons en invoervelden. Laat inhoudsopgave, voortgang en spierdetails door lijnen en ruimte groeperen.
- Geef de dagelijkse oefening één prominent vlak. Presenteer de andere lessen als rijen met een duidelijke titel, onderwerp en voortgang.
- Maak van de atlas een werkblad. Zet de modeltitel boven het model, plaats bedieningsknoppen bij het model en zet de geselecteerde spier met duidelijke tekst eronder. Kleine figuurlabels mogen aanvullen, maar instructies en bediening blijven leesbaar.
- Gebruik op mobiel een rustige enkele kolom. Bij vragen over het model blijft het model dichtbij de vraag. Verminder witruimte op smalle schermen voordat tekst kleiner wordt.
- Stem ook oefenresultaten, accountscherm, lege toestanden en privacydialoog op deze basis af. Een ander dashboard alleen lost het verschil tussen schermen niet op.

Deze projecten dienen als visuele inspiratie. Hun afbeeldingen, lettertypes en broncode worden niet overgenomen. Eigen CSS past bij de bestaande app en voorkomt extra dependencies. De uitvoering moet worden gecontroleerd op 320 en 390 px, focus, toetsenbordbediening, contrast, touchtargets en reduced motion.
