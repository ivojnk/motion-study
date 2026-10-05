// Original coaching applications. Research supports the learning principles,
// not the effectiveness of each individual correction below.
export const coachingReferences = [
  { title: 'Externe focus bij krachttraining: Grgic e.a. (2021)', url: 'https://pubmed.ncbi.nlm.nih.gov/34822352/' },
  { title: 'Leren met analogieën: Zacks & Friedman (2020)', url: 'https://www.nature.com/articles/s41598-020-63999-1' }
];

const principles = [
  ['external-focus', 'Wat betekent externe focus bij een bewegingscue?', 'Aandacht richten op het effect van de beweging op de omgeving of het materiaal', ['Aandacht richten op de spanning van één spier', 'Iedere gewrichtshoek bewust controleren', 'Alleen luisteren naar een instructie van iemand anders'], '“Duw de vloer weg” richt de aandacht op de vloer. Een cue van een trainer is niet automatisch extern: “span je quadriceps aan” heeft interne focus.'],
  ['implicit-analogy', 'Hoe gebruik je een analogie als impliciete cue?', 'Een herkenbaar beeld gebruiken dat meerdere technische regels samenvat', ['Alle gewrichtshoeken één voor één laten opnoemen', 'Uitleggen welke spiervezels moeten aanspannen', 'De sporter tijdens elke herhaling alle fouten laten analyseren'], '“Duw de lade dicht” geeft een bewegingsbeeld. Dit kan impliciet leren ondersteunen, maar één beeld bewijst niet dat de beweging al automatisch is geleerd.'],
  ['focus-versus-implicit', 'Zijn externe focus en impliciete cues hetzelfde?', 'Nee: externe focus beschrijft het aandachtsdoel, impliciete cues beperken expliciete technische regels', ['Ja: elke instructie van een trainer is extern en impliciet', 'Ja: beide betekenen dat je geen feedback geeft', 'Nee: een analogie kan nooit een externe focus hebben'], 'Een cue kan beide combineren: “duw de lade dicht” is een analogie met een extern doel. Een exacte instructie over het pad van een stang kan externe focus hebben en toch expliciet zijn.'],
  ['one-cue', 'Hoe test je een cue bij een zichtbaar energielek?', 'Kies één cue, observeer enkele herhalingen en vergelijk het lek met de uitgangssituatie', ['Geef vijf nieuwe aanwijzingen tegelijk en verhoog direct het gewicht', 'Beoordeel alleen of de sporter de uitleg kan herhalen', 'Blijf dezelfde cue herhalen zonder de beweging te bekijken'], 'Kies vooraf een zichtbaar controlepunt. Kijk ook of de cue een andere compensatie oproept. Een mooi beeld is pas bruikbaar wanneer de uitvoering verbetert.'],
  ['no-improvement', 'Wat doe je als een energielek ondanks een cue blijft bestaan?', 'Pas belasting, bewegingsuitslag, steun of oefenvariant aan en beoordeel opnieuw', ['Neem aan dat de sporter de cue niet goed genoeg gehoorzaamt', 'Vergroot de bewegingsuitslag en belasting tegelijk', 'Negeer het lek zodra de sporter de cue begrijpt'], 'Een cue kan een beperking in kracht, mobiliteit, balans of belastbaarheid niet automatisch oplossen. Kies een uitvoerbare variant en toets dezelfde beweging opnieuw.'],
  ['retention', 'Hoe controleer je of een correctie ook zonder de cue behouden blijft?', 'Laat later enkele herhalingen zonder herinnering of hulpmiddel uitvoeren en observeer opnieuw', ['Herhaal de cue onafgebroken en neem aan dat de beweging geleerd is', 'Vraag alleen of de sporter de zin uit het hoofd kent', 'Test uitsluitend met een zwaarder gewicht en meer aanwijzingen'], 'Verbetering tijdens coaching en zelfstandig behoud zijn verschillende uitkomsten. Bouw de hulp af zodra dat lukt en kijk of de correctie standhoudt.']
];

// key, chapter, leak, related course question, cue, observable check, adaptation.
const corrections = [
  ['squat-hyperextension', 'patronen', 'een overstrekte onderrug bij de squat', 'extra-patterns-squat-hyperextension', '“Houd het denkbeeldige blikje tussen borst en bekken heel.”', 'De onderrug wordt niet holler tijdens het zakken of opstaan.', 'Oefen zo nodig een lichtere goblet squat. Het blikje is een analogie, geen opdracht om de romp maximaal rond te maken.'],
  ['squat-stripper', 'patronen', 'een stripper squat waarbij de heup eerder stijgt dan de stang', 'concept-44', '“Duw de vloer weg en laat de stang en heup samen omhoog reizen.”', 'Heup en stang stijgen tegelijk zonder dat de romp plots verder voorover kantelt.', 'Verlaag de belasting of gebruik een paused goblet squat als gelijktijdig opstijgen niet lukt.'],
  ['squat-valgus', 'patronen', 'een knie die naar binnen valt bij de squat', 'concept-47', '“Volg met je knieën twee rails in de richting van je tenen.”', 'De knieën volgen de gekozen teenrichting zonder dat de voeten naar hun buitenrand rollen.', 'De rails zijn een analogie. Pas voetstand en belasting aan als de knie naar binnen blijft vallen.'],
  ['squat-shift', 'patronen', 'een hip shift bij de squat', 'extra-patterns-squat-hip-shift', '“Zak tussen twee denkbeeldige liftwanden recht omlaag.”', 'Het bekken schuift minder zijwaarts en de voetdruk blijft aan beide kanten aanwezig.', 'Controleer eerst de voetpositie. Een licht elastiek kan een referentie geven, maar harder naar buiten drukken is geen algemene oplossing voor een hip shift.'],
  ['front-squat-collapse', 'patronen', 'bovenrugflexie met zakkende ellebogen bij de front squat', 'extra-patterns-squat-back-flexion', '“Houd je dienblad waterpas.”', 'De ellebogen zakken niet weg en de stang blijft op dezelfde steunplaats.', 'Het dienblad is een analogie. Gebruik een lichtere belasting of een passende grip als de positie niet behouden blijft.'],
  ['squat-butt-wink', 'patronen', 'butt wink onderin de squat', 'extra-patterns-squat-butt-wink', '“Tik de box aan en kom weer omhoog.”', 'De gekozen boxhoogte begrenst de diepte vóór het bekken onderkantelt en de onderrug rondt.', 'Pas de boxhoogte en voetstand aan. De box begrenst de oefening, maar vergroot de beschikbare mobiliteit niet vanzelf.'],
  ['hinge-hyperextension', 'patronen', 'hyperextensie bij de hinge', 'extra-patterns-hinge-hyperextension', '“Duw met je bil de lade dicht.”', 'De heup beweegt naar achteren terwijl borst en hoofd mee zakken zonder extra holling van de onderrug.', 'Dit beeld staat ook in het cursusblad. Bij het opstaan eindig je rechtop zonder achterover te leunen.'],
  ['hinge-hyperflexion', 'patronen', 'een ronde rug door te diep zakken in de RDL', 'extra-patterns-hinge-hyperflexion', '“Houd de drie contactpunten met de stok vast.”', 'Bil, bovenrug en achterhoofd houden tijdens een onbelaste hinge contact, zonder de natuurlijke rugcurve weg te drukken.', 'Stop vóór een contactpunt verloren gaat en beperk de diepte van de belaste RDL tot die controleerbare uitslag. De stok is een tastbare referentie.'],
  ['hinge-knees', 'patronen', 'te veel kniebuiging of kniestrekking bij de hinge', 'extra-patterns-hinge-knee', '“Laat de stok achter je schenen met rust.”', 'Na een kleine beginbuiging blijft de kniehoek ongeveer gelijk en raken de schenen de referentiestok niet.', 'Oefen onbelast met een vrijstaande stok als referentie. Zet de knieën niet op slot en dwing ze niet naar overstrekking.'],
  ['hinge-shift', 'patronen', 'een hip shift bij de hinge', 'extra-patterns-hinge-hip-shift', '“Duw de lade midden tussen de twee handgrepen dicht.”', 'De heup gaat naar achteren zonder zijwaartse verschuiving, met druk onder beide voeten.', 'Gebruik een centraal doel achter je en pas stand, steun of belasting aan als het bekken blijft uitwijken.'],
  ['hinge-bar-away', 'patronen', 'een stang die bij de RDL van het lichaam af beweegt', 'extra-patterns-hinge-away', '“Laat de stang langs je broek naar beneden glijden.”', 'De stang blijft dichtbij en beweegt boven de middenvoet zonder dat de rug extra rondt.', 'Het glijden is een analogie, geen opdracht om hard tegen de benen te schuren. Controleer ook of de heup voldoende naar achteren gaat.'],
  ['push-hyperextension', 'patronen', 'lumbale hyperextensie bij horizontaal duwen', 'extra-patterns-push-low-back', '“Houd het blikje tussen borst en bekken heel.”', 'De onderrug wordt niet verder hol en het bekken blijft stabiel tijdens het duwen.', 'Gebruik bij push-ups een hogere steun. Bij bench press beperk je leg drive die de rompstand verstoort, met behoud van de gekozen uitgangspositie.'],
  ['push-shoulder-dump', 'patronen', 'schouderdump onderin een DB bench press', 'extra-patterns-shoulder-dump', '“Laat de dumbbells zakken tot de afgesproken stoplijn.”', 'De schouderkop rolt niet naar voren bij de gekozen einddiepte.', 'Kies de stoplijn met een lichte belasting. Minder diepte is hier een oefenaanpassing, geen bewijs dat een cue de schoudercontrole volledig herstelt.'],
  ['push-flaring', 'patronen', 'ellebogen die te ver naar buiten wijken bij horizontaal duwen', 'extra-patterns-push-flaring', '“Volg twee schuine rails met de gewichten.”', 'De ellebogen blijven bij brede grip ongeveer 45–60° van de romp en de polsen staan boven de ellebogen.', 'De rails zijn een bewegingsbeeld. Pas hand- of grippositie aan wanneer dit pad niet comfortabel uitvoerbaar is.'],
  ['bench-feet', 'patronen', 'voeten die loskomen bij de bench press', 'extra-patterns-bench-leaks', '“Houd beide voetafdrukken op de vloer.”', 'Beide voeten behouden contact tijdens de hele herhaling.', 'Verplaats de voeten of gebruik een stabiele verhoging als de voeten de vloer niet goed bereiken.'],
  ['bench-butt', 'patronen', 'billen die loskomen bij de bench press', 'extra-patterns-bench-leaks', '“Houd je afdruk op de bank.”', 'De billen blijven op de bank terwijl de voeten druk leveren.', 'Verminder leg drive of belasting als de druk vanuit de voeten het bekken optilt.'],
  ['bench-head', 'patronen', 'een hoofd dat omhoogkomt bij de bench press', 'extra-patterns-bench-leaks', '“Laat de hoofdsteun je hoofd blijven dragen.”', 'Het achterhoofd houdt rustig contact met de bank zonder extra druk vanuit de nek.', 'Gebruik een lichtere belasting als het hoofd blijft optillen. De cue vraagt om contact, niet om hard in de bank te drukken.'],
  ['row-hyperextension', 'patronen', 'lumbale hyperextensie bij een row', 'extra-patterns-row-leaks', '“Houd contact met de borststeun terwijl het handvat naar je toe komt.”', 'De romp blijft op de steun zonder dat de onderrug verder hol wordt.', 'Kies een row met borststeun en verlaag de belasting als je moet achterover trekken om de herhaling af te maken.'],
  ['row-shoulder-dump', 'patronen', 'schouderdump aan het eind van een row', 'extra-patterns-row-leaks', '“Breng het handvat tot het doel en stop daar.”', 'Bij het gekozen doel rolt de schouderkop niet naar voren en trekken de ellebogen niet verder door.', 'Kies het doel met een lichte belasting. Meer trekafstand is niet automatisch een betere herhaling.'],
  ['row-elevation', 'patronen', 'opgetrokken schouders bij een row', 'extra-patterns-row-leaks', '“Trek het handvat richting je achterzakken.”', 'Tijdens deze low-row-variant komen de schouders niet omhoog en blijft de romp rustig.', 'Deze cue past bij een row met de ellebogen dichtbij. Gebruik haar niet om elke row in dezelfde lage trekrichting te dwingen.'],
  ['press-hyperextension', 'patronen', 'lumbale hyperextensie bij de overhead press', 'extra-patterns-vertical-push-leaks', '“Houd het blikje heel terwijl je het gewicht omhoog duwt.”', 'De onderrug wordt niet holler terwijl de armen omhoog bewegen.', 'Verlaag de belasting of kies een half-kneeling landmine press als de overheadpositie zonder compensatie niet lukt.'],
  ['press-elevation', 'patronen', 'te vroeg optrekken van de schouders bij verticaal duwen', 'extra-patterns-vertical-push-leaks', '“Reik met het gewicht naar het plafond.”', 'De schouderbladen draaien mee omhoog zonder een vroege losse shrug die de duwbeweging vervangt.', 'Lichte elevatie bovenin hoort bij de beweging. Zet de schouderbladen niet tijdens de hele press geforceerd vast naar beneden.'],
  ['press-sidebend', 'patronen', 'zijwaarts buigen van de romp bij verticaal duwen', 'extra-patterns-vertical-push-leaks', '“Blijf tussen twee denkbeeldige muren terwijl het gewicht omhooggaat.”', 'Borst en bekken blijven boven elkaar zonder zijwaarts uitwijken.', 'Maak het gewicht lichter of gebruik een stabielere houding als je buiten de denkbeeldige muren blijft leunen.'],
  ['press-stack', 'patronen', 'een pols die niet boven de elleboog staat bij een DB overhead press', 'extra-patterns-vertical-push-leaks', '“Bouw een rechte toren onder de dumbbell.”', 'Van voren blijft de pols boven de elleboog en blijft de onderarm onder het gewicht.', 'De toren is een analogie voor uitlijning. Controleer ook de zijaanblik en pas grip, belasting of variant aan als de overheadpositie niet lukt. Bij een landmine ligt het duwpad schuin.'],
  ['pull-shoulder-dump', 'patronen', 'schouderdump onderin de lat pulldown', 'extra-patterns-vertical-pull-leaks', '“Breng het handvat tot je doel en laat het daar stoppen.”', 'De schouderkop rolt bij de gekozen eindpositie niet naar voren.', 'Beperk de trekdiepte en belasting wanneer verder doortrekken de schouderpositie verstoort.'],
  ['pull-hyperextension', 'patronen', 'lumbale hyperextensie bij verticaal trekken', 'extra-patterns-vertical-pull-leaks', '“Houd het blikje tussen borst en bekken heel terwijl het handvat daalt.”', 'De onderrug blijft stabiel terwijl de bovenrug gecontroleerd mag strekken.', 'Verminder belasting of gebruik een ondersteunde variant als je de herhaling met achterover leunen moet afmaken.'],
  ['pull-forearm', 'patronen', 'onderarmen die bij een lat pulldown horizontaal eindigen', 'extra-patterns-vertical-pull-leaks', '“Laat de uiteinden van het handvat via twee verticale rails zakken.”', 'De onderarmen blijven bij het gekozen eindpunt ongeveer verticaal onder de greep.', 'Pas grip en einddiepte aan als de onderarmen naar achteren draaien. Het doel is een passende treklijn, niet het handvat zo laag mogelijk krijgen.'],
  ['deadbug', 'core', 'een holle rug en omhooggaande ribben bij dead bug', 'extra-muscles-deadbug-cue', '“Houd het handdoekje onder je onderrug rustig op zijn plek.”', 'De druk op een dun handdoekje bij de gekozen rugpositie blijft ongeveer gelijk terwijl arm en been bewegen.', 'Verklein de arm- of beenuitslag. De handdoek geeft feedback, zonder opdracht om de natuurlijke rugcurve maximaal plat te duwen.'],
  ['birddog', 'core', 'verlies van rompspanning bij bird dog', 'extra-muscles-birddog-cue', '“Laat het denkbeeldige dienblad op je rug niet kantelen.”', 'Romp en bekken draaien of zakken niet weg tijdens het uitstrekken.', 'Begin met alleen een arm of been als gelijktijdig uitstrekken de positie verstoort.'],
  ['plank', 'core', 'een heup die te hoog of te laag staat in de plank', 'extra-muscles-plank-cue', '“Maak een brug tussen je steunpunten.”', 'Schouders, bekken en enkels blijven in de gekozen rechte lijn zonder doorzakken of een hoge punt.', 'Verkort de houdtijd of gebruik een hogere steun als de brugvorm niet behouden blijft.'],
  ['back-hold', 'core', 'hyperextensie tijdens een back extension hold', 'extra-muscles-back-hold-cue', '“Verleng de schuine plank van de bank, zonder eroverheen te knikken.”', 'De romp eindigt in het verlengde van de benen en buigt niet verder achterover.', 'Verlaag de belasting of verkort de houdtijd wanneer de positie wegvalt. De plank is een analogie voor de eindlijn.'],
  ['pallof', 'core', 'afwijken van de streklijn of verliezen van de rompstand bij Pallof press', 'extra-muscles-pallof-cue', '“Duw het handvat recht naar het doel vóór je en houd de koplampen daarop gericht.”', 'Het handvat volgt dezelfde lijn en borst en bekken blijven naar voren gericht zonder bollen of hol trekken.', 'De koplampen zijn een analogie voor de romp. Verlaag de kabelweerstand of verkort de armhefboom als de lijn niet behouden blijft.'],
  ['anti-chop', 'core', 'verlies van bovenrugstabilisatie bij anti-rotation chop', 'extra-muscles-anti-chop-cue', '“Beweeg het touw door de baan terwijl je koplampen vooruit blijven schijnen.”', 'De armen verplaatsen het touw zonder dat de romp meedraait of de bovenrug inzakt.', 'Gebruik een lichtere kabelweerstand en een kortere baan als de romppositie niet stabiel blijft.'],
  ['side-plank', 'core', 'een te hoge of lage heup en verlies van rompstand bij side plank', 'extra-muscles-sidehold-cue', '“Maak een rechte brug tussen elleboog en voeten.”', 'Schouder, bekken en enkels blijven op één lijn, zonder zijwaarts doorzakken of voor- of achterover kantelen.', 'Gebruik een variant met steun op de knieën of een kortere houdtijd wanneer de lijn wegvalt.'],
  ['carry', 'core', 'zijwaarts leunen tijdens KB march & walk', 'extra-muscles-sidehold-cue', '“Draag een denkbeeldig glas op een waterpas dienblad.”', 'Borst en bekken blijven boven elkaar tijdens stappen, zonder naar het gewicht toe of ervan weg te leunen.', 'De cue is een analogie. Kies een lichter gewicht of oefen eerst stilstaand voordat je gaat stappen.']
];


// Contrast with mistakes in this specific correction, rather than other cues
// that might also be useful for the same movement.
const correctionDistractors = {
  'squat-hyperextension': ['“Maak je onderrug zo hol mogelijk.”', '“Til je borst omhoog zonder je bekken mee te nemen.”', '“Leun bovenin achterover om de herhaling af te maken.”'],
  'squat-stripper': ['“Laat je heup eerst omhoog schieten.”', '“Strek eerst je knieën en til daarna de stang op.”', '“Laat de stang laag terwijl je heup omhooggaat.”'],
  'squat-valgus': ['“Laat je knieën naar elkaar toe bewegen.”', '“Rol op de buitenranden van je voeten.”', '“Houd je knieën bij elkaar, ongeacht je teenrichting.”'],
  'squat-shift': ['“Zak steeds naar je sterkste kant.”', '“Verplaats al je druk naar één voet.”', '“Laat je bekken zijwaarts uitwijken voor extra diepte.”'],
  'front-squat-collapse': ['“Laat je dienblad naar voren kantelen.”', '“Laat je ellebogen onderin naar de vloer wijzen.”', '“Rol de stang tijdens het zakken van zijn steunplaats.”'],
  'squat-butt-wink': ['“Zak verder zodra je onderrug begint te ronden.”', '“Raak de vloer aan, ongeacht je bekkenpositie.”', '“Gebruik dezelfde boxhoogte voor iedere sporter.”'],
  'hinge-hyperextension': ['“Houd je borst zo hoog mogelijk terwijl je heup teruggaat.”', '“Leun bovenin achterover.”', '“Maak de boog in je onderrug groter tijdens het zakken.”'],
  'hinge-hyperflexion': ['“Laat je hoofd loskomen van de stok voor extra diepte.”', '“Zak tot de vloer, ook als de rug rondt.”', '“Verplaats alle druk naar je tenen en zak verder.”'],
  'hinge-knees': ['“Duw de stok achter je schenen weg.”', '“Strek je knieën maximaal op slot vóór je beweegt.”', '“Zak met je knieën ver naar voren alsof je een squat doet.”'],
  'hinge-shift': ['“Duw de lade met één kant van je bekken dicht.”', '“Verplaats alle druk naar één voet.”', '“Schuif je heup naar de kant die het makkelijkst beweegt.”'],
  'hinge-bar-away': ['“Duw de stang ver voor je tenen.”', '“Laat de stang van je broek weg zweven.”', '“Houd je heup vooraan terwijl de stang naar voren gaat.”'],
  'push-hyperextension': ['“Vergroot de holling tijdens het duwen.”', '“Duw je ribben omhoog voor extra bereik.”', '“Laat je bekken zakken terwijl je borst omhooggaat.”'],
  'push-shoulder-dump': ['“Laat de gewichten zo diep mogelijk zakken.”', '“Rol je schouderkop naar voren aan het einde.”', '“Vergroot de diepte zodra je schouder naar voren rolt.”'],
  'push-flaring': ['“Laat je ellebogen haaks op je romp uitwaaieren.”', '“Schuif je polsen ver buiten je ellebogen.”', '“Duw de gewichten naar buiten, weg van de gekozen rails.”'],
  'bench-feet': ['“Til je voeten op zodra het gewicht stijgt.”', '“Laat je voeten boven de vloer zweven.”', '“Verplaats je voeten tijdens iedere duwfase.”'],
  'bench-butt': ['“Til je afdruk van de bank.”', '“Duw met je voeten totdat je bekken loskomt.”', '“Maak ruimte tussen je billen en de bank.”'],
  'bench-head': ['“Til je hoofd op om het gewicht te volgen.”', '“Duw je achterhoofd zo hard mogelijk in de bank.”', '“Maak je hoofd los van de steun bij iedere herhaling.”'],
  'row-hyperextension': ['“Trek je borst los van de steun.”', '“Gooi je romp achterover om de trek af te maken.”', '“Maak je onderrug holler zodra het handvat dichterbij komt.”'],
  'row-shoulder-dump': ['“Trek het handvat altijd zo ver mogelijk door.”', '“Duw je schouderkop naar voren terwijl je elleboog naar achteren gaat.”', '“Laat het doel steeds verder achter je romp liggen.”'],
  'row-elevation': ['“Trek het handvat met een shrug omhoog.”', '“Breng je schouders eerst naar je oren.”', '“Haal de trek vooral uit het optillen van je schouders.”'],
  'press-hyperextension': ['“Duw je ribben omhoog voor extra hoogte.”', '“Leun achterover om onder het gewicht te komen.”', '“Maak je onderrug holler terwijl het gewicht stijgt.”'],
  'press-elevation': ['“Zet je schouderbladen tijdens de hele press vast naar beneden.”', '“Begin elke press met een losse shrug.”', '“Laat je schouderbladen niet omhoog draaien.”'],
  'press-sidebend': ['“Leun opzij om ruimte te maken voor het gewicht.”', '“Laat borst en bekken naar verschillende kanten bewegen.”', '“Schuif je romp buiten de denkbeeldige muren.”'],
  'press-stack': ['“Laat de dumbbell ver naast de onderarm zweven.”', '“Laat je pols buiten de elleboog uitwijken.”', '“Kantel de toren tijdens het omhoogduwen.”'],
  'pull-shoulder-dump': ['“Trek door zodra je schouderkop naar voren rolt.”', '“Breng het handvat zo laag mogelijk, ongeacht de schouderstand.”', '“Rol de schouders naar voren in de eindpositie.”'],
  'pull-hyperextension': ['“Maak je onderrug holler terwijl het handvat daalt.”', '“Gooi je romp achterover voor extra trekafstand.”', '“Laat de ribben omhoogkomen terwijl het bekken blijft staan.”'],
  'pull-forearm': ['“Draai je onderarmen achterwaarts naar horizontaal.”', '“Trek het handvat lager, ook als de onderarmen kantelen.”', '“Laat de greep ver vóór de ellebogen eindigen.”'],
  deadbug: ['“Laat de druk op het handdoekje verdwijnen.”', '“Duw je ribben omhoog zodra het been strekt.”', '“Vergroot de uitslag terwijl de rug holler wordt.”'],
  birddog: ['“Kantel het dienblad naar de uitgestrekte kant.”', '“Draai je bekken mee met je been.”', '“Til arm en been zo hoog mogelijk, ook als je romp wegzakt.”'],
  plank: ['“Laat de brug in het midden doorzakken.”', '“Maak een hoge punt van de brug.”', '“Verleng de houdtijd terwijl de rompstand wegvalt.”'],
  'back-hold': ['“Knik voorbij de lijn van de bank naar achteren.”', '“Til de romp altijd hoger dan de benen.”', '“Maak je onderrug maximaal hol om de houding vast te houden.”'],
  pallof: ['“Laat het handvat naar de kabel toe afbuigen.”', '“Draai je koplampen mee richting de kabel.”', '“Vergroot de holling om verder te kunnen reiken.”'],
  'anti-chop': ['“Draai je romp mee met het touw.”', '“Laat de bovenrug inzakken terwijl het touw beweegt.”', '“Laat je koplampen met elke trek meedraaien.”'],
  'side-plank': ['“Laat het midden van de brug zakken.”', '“Til je heup zo hoog mogelijk boven de lijn.”', '“Rol voorover om de positie langer vol te houden.”'],
  carry: ['“Kantel het dienblad bij iedere stap.”', '“Leun met je romp naar het gewicht toe.”', '“Hang zijwaarts van het gewicht weg.”']
};

export function coachingQuestions(courseQuestions) {
  const lookup = new Map(courseQuestions.map(question => [question.id, question]));
  const source = (region, relatedId) => {
    const related = relatedId ? lookup.get(relatedId) : null;
    if (relatedId && !related) throw new Error('Missing coaching course reference: ' + relatedId);
    return {
      kind: 'supplement', title: 'Aanvullende coachingvoorbeelden', section: region,
      references: coachingReferences,
      ...(related ? { courseReferences: [{ questionId: related.id, page: related.source.page }] } : {})
    };
  };
  return [
    ...principles.map(([key, prompt, answer, distractors, explanation]) => ({
      id: 'coaching-' + key, region: 'patronen', type: 'choice', prompt, answer, distractors, explanation,
      source: source('patronen')
    })),
    ...corrections.map(([key, region, leak, relatedId, cue, check, adaptation]) => ({
      id: 'coaching-' + key, region, type: 'choice',
      prompt: 'Welke cue richt zich op ' + leak + '?', answer: cue,
      distractors: correctionDistractors[key],
      explanation: 'Controle: ' + check + ' ' + adaptation,
      source: source(region, relatedId)
    }))
  ];
}
