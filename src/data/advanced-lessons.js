// Questions authored from the supplied lessons 7–9. They intentionally stay
// in a separate source batch so existing chapter partitions never shift.
const source = (lesson, section) => ({
  kind: 'course-detail', title: lesson, section
});

const nutrition = [
  ['obesogene-omgeving', 'Wat bevordert een obesogene omgeving?', 'Ongezonde voedingskeuzes en een inactieve leefstijl', ['Alleen topsport', 'Uitsluitend voldoende slaap', 'Alleen genetische aanleg'], 'Sociaal'],
  ['sct-wisselwerking', 'Wat beschrijft de Sociale Cognitieve Theorie?', 'De wisselwerking tussen persoonlijke factoren, gedrag en omgeving', ['Dat gedrag alleen door wilskracht ontstaat', 'Dat de omgeving geen invloed heeft', 'Dat alleen beloning gedrag bepaalt'], 'Sociale Cognitieve Theorie'],
  ['zelfeffectiviteit', 'Wat betekent zelfeffectiviteit in de Sociale Cognitieve Theorie?', 'Vertrouwen dat je een actie succesvol kunt uitvoeren', ['Anderen altijd beter kunnen nadoen', 'Je omgeving volledig kunnen controleren', 'Een externe beloning verwachten'], 'Sociale Cognitieve Theorie'],
  ['dieetmindset', 'Welk patroon kan een strikte dieetmindset versterken?', 'Een cyclus van restrictie en overeten', ['Een flexibele omgang met eten', 'Meer zelfcompassie na een misstap', 'Automatisch duurzame motivatie'], 'Psychologie'],
  ['zelfdeterminatie', 'Welke drie basisbehoeften horen bij de zelfdeterminatietheorie?', 'Autonomie, competentie en verbondenheid', ['Prestatie, perfectie en controle', 'Restrictie, beloning en competitie', 'Snelheid, kracht en uithoudingsvermogen'], 'Psychologie'],
  ['stress-coping', 'Welke drie aangrijpingspunten noemt de les bij stress?', 'De situatie aanpakken, middelen vergroten of de beleving beïnvloeden', ['Stress altijd negeren, harder trainen of minder slapen', 'Alleen ademhaling aanpassen', 'Alleen de omgeving veranderen'], 'Psychologie'],
  ['metabolisme', 'Wat is metabolisme?', 'Alle chemische processen die voedingsstoffen omzetten voor lichaamsfuncties', ['Alleen de vertering van vetten', 'Alleen energieverbruik tijdens training', 'De opslag van water in cellen'], 'Biologie: kwantiteit'],
  ['energiebalans', 'Wat gebeurt er bij energie-inname die structureel hoger is dan energieverbruik?', 'Er wordt energie opgeslagen en het gewicht kan toenemen', ['Energie verdwijnt uit het lichaam', 'Het rustmetabolisme stopt', 'Gewicht moet altijd dalen'], 'Energiebalans'],
  ['tdee-neat', 'Waar staat NEAT binnen het totale dagelijkse energieverbruik voor?', 'Alledaagse beweging, zoals lopen en huishoudelijk werk', ['Geplande zware training', 'Energie voor vertering', 'Energie voor vitale functies in rust'], 'Factoren die energieverbruik bepalen (TDEE)'],
  ['tef', 'Welk macronutriënt heeft volgens de les het hoogste thermische effect van voeding?', 'Eiwit', ['Vet', 'Koolhydraten', 'Water'], 'Factoren die energieverbruik bepalen (TDEE)'],
  ['ghreline', 'Welk hormoon verhoogt eetlust wanneer de maag leeg is?', 'Ghreline', ['Leptine', 'Insuline', 'Melatonine'], 'Eetlust'],
  ['hedonisch-eten', 'Wat is hedonistische regulering van eetgedrag?', 'Trek zonder fysieke behoefte, vaak door prikkels, emoties of beloning', ['Eten door een fysiek energietekort', 'Het verteren van vezels', 'Het plannen van een maaltijd na training'], 'Eetlust'],
  ['calorische-dichtheid', 'Wat betekent calorische dichtheid?', 'Het aantal calorieën per gram voeding', ['Het aandeel vitamines per liter', 'De hoeveelheid eiwit per maaltijd', 'De snelheid waarmee voedsel wordt gegeten'], 'Type voeding'],
  ['slaapdruk', 'Waardoor bouwt homeostatische slaapdruk op tijdens het waken?', 'Adenosine dat vrijkomt bij ATP-gebruik', ['Alleen blauw licht', 'Een daling van leptine', 'Een stijging van glycogeen'], 'Slaap'],
  ['macronutrienten', 'Welke drie voedingsstoffen zijn macronutriënten?', 'Eiwitten, vetten en koolhydraten', ['Vitamines, mineralen en water', 'Vezels, natrium en ijzer', 'Omega-3, omega-6 en cholesterol'], 'Macronutriënten'],
  ['eiwitfunctie', 'Welke combinatie ondersteunt volgens de les het behoud en de opbouw van spiermassa het meest?', 'Krachttraining en voldoende eiwitinname', ['Alleen extra vetinname', 'Alleen slaap verlengen', 'Alleen calorieën tellen'], 'Eiwitten'],
  ['vetoplosbare-vitamines', 'Welke vitamines zijn vetoplosbaar?', 'A, D, E en K', ['B en C', 'B, C en D', 'Alleen C en K'], 'Micronutriënten'],
  ['complexe-koolhydraten', 'Welke bron past het best bij complexe koolhydraten?', 'Volkoren granen en peulvruchten', ['Frisdrank en snoep', 'Alleen olie', 'Zuivere suiker'], 'Koolhydraten'],
  ['volwaardige-voeding', 'Wat is volgens de les de belangrijkste bron van micronutriënten?', 'Volwaardige, minimaal bewerkte voeding', ['Supplementen als standaardvervanging', 'Alleen eiwitpoeder', 'Sterk bewerkte producten'], 'Volwaardige voeding'],
  ['evidence-based-practice', 'Wat combineert evidence-based practice in leefstijlcoaching?', 'Wetenschappelijk bewijs, expertise en de behoeften van de cliënt', ['Alleen de nieuwste trend', 'Alleen de voorkeur van de coach', 'Een vast programma voor iedereen'], 'Gedragsverandering'],
  ['hefbomeffect', 'Wat betekent het hefboomeffect in leefstijlcoaching?', 'Maximale resultaten met minimale inspanning', ['Zoveel mogelijk tegelijk veranderen', 'Alleen zware training inzetten', 'Alle voeding nauwkeurig wegen'], 'Gedragsverandering']
].map(([id, prompt, answer, distractors, section]) => ({
  id: 'lesson-7-' + id, region: 'voeding', type: 'choice', prompt, answer, distractors,
  source: source('Les 7: Voeding & leefstijl', section)
}));

const strength = [
  ['force', 'Wat betekent force in de les over kracht?', 'De kracht die intern of tegen externe weerstand wordt gegenereerd', ['Alleen hoeveel iemand kan deadliften', 'Alleen spiermassa', 'De rusthartslag'], 'Krachtige professor'],
  ['power-formule', 'Welke formule hoort bij power?', 'Force × velocity', ['Force ÷ velocity', 'Massa × tijd', 'Volume × frequentie'], 'Krachtige professor'],
  ['type-i', 'Welke spiervezels zijn traag en sterk vermoeidheidsresistent?', 'Type I-vezels', ['Type IIx-vezels', 'Alleen hybride vezels', 'Type IIa-vezels'], 'Genereren van kracht'],
  ['type-iix', 'Welke spiervezels trekken het snelst samen maar vermoeien ook snel?', 'Type IIx-vezels', ['Type I-vezels', 'Type IIa-vezels', 'Alleen hybride vezels'], 'Genereren van kracht'],
  ['size-principle', 'Welke motor units worden volgens het size principle eerst gerekruteerd?', 'Kleine, langzame motor units', ['De grootste en snelste motor units', 'Alle motor units tegelijk', 'Alleen motor units van type IIx'], 'Motor units en de size principle theory'],
  ['spiermassa', 'Welke uitspraak over spiermassa en maximale kracht past bij de les?', 'Spiervolume is relevant, maar slechts één van meerdere factoren', ['Spiervolume bepaalt kracht volledig', 'Spiermassa speelt nooit een rol', 'Alleen lengte bepaalt kracht'], 'Spiercontractie en -vermogen'],
  ['kracht-coachingslus', 'Welke volgorde hoort bij de coachingslus?', 'Observeren, analyseren, interventie kiezen, uitvoeren en evalueren', ['Alleen corrigeren en doorgaan', 'Eerst straffen, dan uitleggen', 'Alleen een oefening demonstreren'], 'Krachtig coachen'],
  ['trainen-met-intentie', 'Wat is het doel van trainen met intentie?', 'De gewenste bewegingskwaliteit en inzet bewust uitvoeren', ['Zo snel mogelijk elke set afmaken', 'Alleen meer gewicht gebruiken', 'Geen aandacht aan techniek geven'], 'Het doel van trainen met intentie'],
  ['sticking-point', 'Wat is een sticking point?', 'Het punt in een beweging waar de weerstand tijdelijk het moeilijkst te overwinnen is', ['Het begin van elke warming-up', 'Een rustdag', 'Een willekeurige houding zonder weerstand'], 'Sticking point en energielek'],
  ['transferwaarde', 'Wat kenmerkt een oefening met een hoge transferwaarde voor kracht?', 'Ze sluit goed aan op de gewenste prestatie of beweging', ['Ze is altijd de meest instabiele oefening', 'Ze gebruikt altijd één gewricht', 'Ze vraagt nooit techniek'], 'Oefeningen gericht op een hoge transferwaarde'],
  ['intensiteit', 'Hoe wordt trainingsintensiteit voor kracht vaak uitgedrukt?', 'Als percentage van de 1RM', ['Alleen als aantal trainingsdagen', 'Alleen als aantal oefeningen', 'Als lichaamstemperatuur'], 'Intensiteit'],
  ['volume', 'Wat vormt trainingsvolume in de basis?', 'De totale hoeveelheid uitgevoerd werk, zoals sets en herhalingen', ['Alleen het gebruikte gewicht', 'Alleen de rusttijd', 'Alleen de warming-up'], 'Volume'],
  ['algemene-warming-up', 'Wat is het hoofddoel van een algemene warming-up?', 'Lichaamstemperatuur verhogen en het lichaam voorbereiden op inspanning', ['De werksets al tot falen uitvoeren', 'De techniek van één specifieke lift testen', 'Maximale vermoeidheid opbouwen'], 'Algemene warming up'],
  ['specifieke-warming-up', 'Wat voeg je met een specifieke warming-up toe?', 'Bewegingen die aansluiten bij het doelpatroon en de komende belasting', ['Alleen passief rekken', 'Een willekeurige cardio-oefening', 'Zoveel mogelijk nieuwe oefeningen'], 'Specifieke warming up'],
  ['opbouwsets', 'Hoe verandert de opbouw naar werksets voor maximale kracht meestal?', 'Het gewicht stijgt terwijl de herhalingen dalen', ['Gewicht en herhalingen stijgen beide steeds', 'Het gewicht daalt en herhalingen dalen', 'Er zijn nooit opbouwsets nodig'], 'Opwarmen van de hoofdoefening'],
  ['beginsituatie', 'Wat is de eerste stap van het programmeerstappenplan?', 'De beginsituatie in kaart brengen', ['De laatste check uitvoeren', 'Direct leefstijlinterventies kiezen', 'Alle trainingen invullen zonder informatie'], 'Stappenplan programmeren'],
  ['belasting-uitschrijven', 'Wat volgt in het stappenplan na de beginsituatie?', 'De belasting uitschrijven', ['De laatste check', 'De week invullen', 'De warming-up overslaan'], 'Stappenplan programmeren']
].map(([id, prompt, answer, distractors, section]) => ({
  id: 'lesson-8-' + id, region: 'kracht', type: 'choice', prompt, answer, distractors,
  source: source('Les 8: Kracht maximaliseren', section)
}));

const coaching = [
  ['effectieve-doelen', 'Welke eigenschap hoort volgens goal-setting theory bij effectieve doelen?', 'Specifiek en uitdagend', ['Vaag en vrijblijvend', 'Altijd volledig extern opgelegd', 'Niet meetbaar'], 'Coaching op doelen'],
  ['procesdoel', 'Wat is een procesdoel?', 'Een concrete actie die nodig is om een einddoel te bereiken', ['Alleen het uiteindelijke resultaat', 'Een willekeurige wens zonder actie', 'Een medische diagnose'], 'Coaching op doelen'],
  ['zelfregulatie', 'Welke stap hoort bij de zelfregulerende cyclus na uitvoeren?', 'Monitoren', ['Stoppen zonder evaluatie', 'Een nieuw doel kiezen zonder te meten', 'Alleen anderen vergelijken'], 'Coaching op doelen'],
  ['sd-theorie', 'Welke behoefte hoort bij de zelfdeterminatietheorie?', 'Verbondenheid', ['Perfectie', 'Externe druk', 'Controle over anderen'], 'Wat drijft de cliënt?'],
  ['woop', 'Waar staat de O in WOOP voor?', 'Obstacle', ['Objective', 'Outcome only', 'Organisation'], 'Doelen duurzaam maken'],
  ['woop-plan', 'Wat is het doel van de Plan-stap in WOOP?', 'Een als-danreactie formuleren voor een verwacht obstakel', ['Alleen een positief eindbeeld bedenken', 'Het doel minder specifiek maken', 'Alle obstakels negeren'], 'Doelen duurzaam maken'],
  ['nivea', 'Waar staat NIVEA voor in gespreksvoering?', 'Niet Invullen Voor Een Ander', ['Nieuwe Informatie Verandert Elk Antwoord', 'Niet Informeren Voor Een Actie', 'Niets Invoeren Voor Een Afspraak'], 'Gesprekstechnieken'],
  ['oma', 'Wat betekent “OMA thuislaten” bij coaching?', 'Oordelen, Meningen en Adviezen niet ongevraagd invullen', ['Een ouder familielid om advies vragen', 'Alleen met gesloten vragen werken', 'De cliënt geen keuzes geven'], 'Gesprekstechnieken'],
  ['lsd', 'Waar staat het LSD-model voor?', 'Luisteren, Samenvatten en Doorvragen', ['Leren, Sturen en Doen', 'Lezen, Schrijven en Delen', 'Lichaam, Stress en Dieet'], 'Gesprekstechnieken'],
  ['grow-reality', 'Wat onderzoekt de Reality-stap in het GROW-model?', 'De huidige situatie', ['Alle mogelijke eindresultaten', 'Alleen de rol van de trainer', 'De kalender voor volgend jaar'], 'Intakegesprek'],
  ['grow-options', 'Wat gebeurt er in de Options-stap van het GROW-model?', 'Mogelijkheden en alternatieven onderzoeken', ['De huidige situatie vastleggen', 'Een doel zonder acties formuleren', 'De intake beëindigen'], 'Intakegesprek'],
  ['bewegingsanalyse', 'Wat is een doel van bewegingsanalyse?', 'Energielekken, kwaliteit, competentie en beperkingen in beeld brengen', ['Alleen het lichaamsgewicht bepalen', 'Een voedingsschema voorschrijven', 'Alleen maximale kracht testen'], 'Bewegingsanalyse'],
  ['bewegingspatronen', 'Welke hoort bij de zes bewegingspatronen uit de les?', 'Hip hinge', ['Wrist curl', 'Nekrotatie', 'Adem vasthouden'], 'Bewegingsanalyse'],
  ['romprichtingen', 'Welke richting hoort bij de rompstijfheidanalyse?', 'Anti-rotatie', ['Alleen schouderabductie', 'Alleen knie-extensie', 'Enkelplantairflexie'], 'De romp'],
  ['hip-disassociation', 'Wat betekent hip disassociation?', 'De heup los van de lumbale wervelkolom kunnen bewegen', ['De knie volledig stilhouden', 'De schouderbladen vastzetten', 'Alleen de enkel bewegen'], 'Hip hinge en squat'],
  ['werkgeheugen', 'Waarom geeft een coach het best niet te veel aanwijzingen tegelijk?', 'Het werkgeheugen kan maar beperkte informatie tegelijk verwerken', ['Meer aanwijzingen zijn altijd beter voor automatisering', 'Cliënten negeren alle uitleg', 'Techniek verandert nooit door feedback'], 'Coachen gebaseerd op leren'],
  ['actief-leren', 'Welke strategie ondersteunt volgens de les effectief leren?', 'Uitvoeren, toepassen en experimenteren', ['Alleen één keer uitleggen', 'Feedback vermijden', 'Complexiteit meteen maximaliseren'], 'Coachen gebaseerd op leren'],
  ['motorisch-leren', 'In welke fase van motorisch leren is de beweging geautomatiseerd?', 'De autonome fase', ['De cognitieve fase', 'De associatieve fase', 'De oriënterende fase'], 'Coachen op kwaliteit van bewegen'],
  ['externe-focus', 'Waar richt een externe cue de aandacht op?', 'Een begrijpelijk element buiten het lichaam', ['Alleen op een spier die moet aanspannen', 'Alleen op het aantal calorieën', 'Alleen op een fout uit het verleden'], 'Coachen naar beter bewegen'],
  ['coachdriehoek', 'Welke rol hoort bij de winnende coachdriehoek?', 'Motivator', ['Scheidsrechter', 'Arts', 'Boekhouder'], 'Coachen naar beter bewegen'],
  ['loopt-lukt-leeft', 'Wat helpt de vraag “Leeft ’t?” een coach te beoordelen?', 'Of de beoogde intentie van de oefening wordt bereikt', ['Of alle materialen nieuw zijn', 'Of de les lang genoeg duurt', 'Of de cliënt een voedingsdagboek bijhoudt'], 'Coachen naar beter bewegen']
].map(([id, prompt, answer, distractors, section]) => ({
  id: 'lesson-9-' + id, region: 'coaching', type: 'choice', prompt, answer, distractors,
  source: source('Les 9: Holistische benadering', section)
}));

export const advancedLessonQuestions = [...nutrition, ...strength, ...coaching];
