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

const nutritionExtension = [
  ['intake-doel', 'Waarom plan je bij leefstijlcoaching zo snel mogelijk een intake?', 'Om behoeften, uitdagingen, mogelijkheden en doelen samen in kaart te brengen', ['Om meteen een vast voedingsschema op te leggen', 'Om training zonder gesprek te starten', 'Om alleen lichaamsgewicht te meten'], 'Leefstijlcoaching: informatie verzamelen'],
  ['intake-sfeer', 'Welke houding past bij een succesvolle intake?', 'Open, veilig, nieuwsgierig en empathisch', ['Oordelend en gehaast', 'Alleen gesloten vragen stellen', 'De agenda van de cliënt negeren'], 'Leefstijlcoaching: informatie verzamelen'],
  ['intake-autonomie', 'Wat benadruk je bij het bespreken van de agenda van een intake?', 'Dat de cliënt eigen keuzes kan maken en de coach richting en steun biedt', ['Dat de coach alle keuzes overneemt', 'Dat doelen niet besproken hoeven worden', 'Dat obstakels buiten het traject vallen'], 'Leefstijlcoaching: informatie verzamelen'],
  ['actieplan', 'Wat leg je op de eerste pagina van een leefstijlactieplan vast?', 'Doel, vaardigheden en acties', ['Alleen een lijst met verboden producten', 'Alleen lichaamsgewicht en BMI', 'Alleen de planning van de coach'], 'Persoonlijk actieplan'],
  ['actieplan-meten', 'Wat hoort op de verdiepende pagina van een actieplan?', 'Hoe voortgang wordt gemeten en wanneer er wordt geëvalueerd', ['Alleen de prijs van het traject', 'Alleen de vorige resultaten', 'Een willekeurige nieuwe doelstelling'], 'Persoonlijk actieplan'],
  ['actiestap', 'Welke actiestap kies je volgens de les als eerste?', 'De actie die de cliënt het meest geschikt vindt en concreet begrijpt', ['De meest ingewikkelde actie', 'Alle acties tegelijk', 'De actie die de coach zonder overleg kiest'], 'Eerstvolgende actiestap'],
  ['consistentie', 'Wat is een logische vervolgstap wanneer een actiestap minder dan 80% consistent lukt?', 'De actie kleiner of makkelijker maken', ['De cliënt straffen', 'Het hele traject stoppen', 'De actie direct moeilijker maken'], 'Volgende actie bepalen'],
  ['langzaam-eten', 'Welk doel heeft langzamer eten volgens de les?', 'Het verzadigingsgevoel beter laten aansluiten', ['De thermische werking van vet verdubbelen', 'Elke maaltijd exact gelijk maken', 'Het slaapritme verkorten'], 'Calorie-inname'],
  ['schermvrij-eten', 'Waarom adviseert de les om zonder schermen te eten?', 'Om met meer aandacht te eten en mindless eten te verminderen', ['Om meer calorieën te verbranden', 'Om de spijsvertering uit te schakelen', 'Om maaltijden sneller op te eten'], 'Calorie-inname'],
  ['eiwit-elke-maaltijd', 'Welke praktische eiwitactie noemt de les?', 'Bij elke maaltijd een hoogwaardige eiwitbron nemen', ['Eiwit alleen direct na training eten', 'Eiwit volledig vermijden bij ontbijt', 'Alleen één grote eiwitmaaltijd per week eten'], 'Voldoende eiwitten'],
  ['plantaardig-eiwit', 'Welke aanpak past bij een veganistisch eetpatroon volgens de les?', 'Verschillende plantaardige eiwitbronnen combineren', ['Alle eiwitbronnen vervangen door suiker', 'Eiwit alleen uit één product halen', 'Geen aandacht aan aminozuren besteden'], 'Voldoende eiwitten'],
  ['groente-twee-maaltijden', 'Welke groente-actie helpt volgens de les een dagelijkse basis op te bouwen?', 'Bij minstens twee maaltijden groente of fruit opnemen', ['Groente alleen na een training eten', 'Groente vervangen door een supplement', 'Groente uitsluitend in het weekend eten'], 'Voldoende groente- en fruit'],
  ['na-maaltijd-bewegen', 'Wat is een praktische beweegactie na een maaltijd?', 'Tien minuten bewegen', ['Meteen een zware maximale set doen', 'De rest van de dag stilzitten', 'Een maaltijd overslaan'], 'Beweeg genoeg'],
  ['neat-duurzaam', 'Waarom kan alledaagse beweging op lange termijn belangrijk zijn?', 'Ze kan duurzaam energieverbruik en naleving ondersteunen', ['Ze vervangt altijd alle training', 'Ze telt niet mee voor energieverbruik', 'Ze werkt alleen bij topsporters'], 'Beweeg genoeg'],
  ['lage-intensiteit', 'Wat kenmerkt een laag-intensieve activiteit in de les?', 'Een inspanning die herstel of het aerobe systeem kan ondersteunen', ['Altijd maximale hartslag', 'Alleen krachttraining met zware sets', 'Volledige rust zonder beweging'], 'Beweeg genoeg'],
  ['gezonde-vetten', 'Welke verandering past bij voldoende vetten?', 'Een bewerkte vetbron vervangen door een minder bewerkte variant', ['Alle vetten volledig schrappen', 'Alleen transvetten kiezen', 'Vetten alleen rond middernacht eten'], 'Eet genoeg vetten'],
  ['cafeine-slaap', 'Welke slaaptip noemt de les voor cafeïne?', 'Neem de laatste dosis ruim voor bedtijd', ['Neem cafeïne vlak voor bedtijd', 'Drink cafeïne alleen in bed', 'Verdubbel de dosis bij vermoeidheid'], 'Slaap goed en genoeg'],
  ['ochtendlicht', 'Waarom kan een ochtendwandeling helpen bij slaap?', 'Daglicht helpt het circadiaanse ritme te reguleren', ['Het vervangt alle slaap', 'Het verlaagt altijd de trainingsfrequentie', 'Het maakt planning overbodig'], 'Slaap goed en genoeg'],
  ['probleemgerichte-coping', 'Wat is probleemgerichte coping?', 'De stressvolle situatie of beschikbare middelen aanpakken', ['De stressreactie uitsluitend wegdrukken', 'Geen enkele actie ondernemen', 'Alleen anderen verantwoordelijk maken'], 'Omgaan met stress'],
  ['emotiegerichte-coping', 'Waar richt emotiegerichte coping zich op?', 'De stressreactie en arousal hanteren', ['Alleen trainingsvolume verhogen', 'Alleen de omgeving controleren', 'Een doel onmeetbaar maken'], 'Omgaan met stress'],
  ['time-management', 'Welke stressinterventie geeft de cliënt volgens de les meer grip op afspraken?', 'Praktische time-managementvaardigheden', ['Meer onduidelijke doelen', 'Minder slaap plannen', 'Alle maaltijden overslaan'], 'Omgaan met stress']
].map(([id, prompt, answer, distractors, section]) => ({
  id: 'lesson-7-' + id, region: 'voeding', type: 'choice', prompt, answer, distractors,
  source: source('Les 7: Voeding & leefstijl', section)
}));

const strengthExtension = [
  ['antropometrie', 'Wat betekent antropometrie in de context van kracht?', 'Lichaamsverhoudingen en hefbomen die prestaties kunnen beïnvloeden', ['Alleen de gekozen muziek', 'Alleen spierpijn na training', 'De kleur van trainingsmateriaal'], 'Antropometrie'],
  ['motorische-vaardigheden', 'Waarom zijn motorische vaardigheden relevant voor maximale kracht?', 'Omdat techniek en aansturing bepalen hoe kracht in een beweging wordt gebruikt', ['Omdat ze spiermassa overbodig maken', 'Omdat ze herstel uitschakelen', 'Omdat ze alleen bij cardio horen'], 'Motorische vaardigheden'],
  ['force-velocity', 'Wat beschrijft de force-velocitycurve?', 'De relatie tussen geleverde kracht en bewegingssnelheid', ['De relatie tussen slaap en voeding', 'De verhouding tussen lengte en gewicht', 'Het aantal stappen per dag'], 'Force velocity curve'],
  ['hoge-intentie', 'Wat bewaakt een coach bij zware krachtsets vooral?', 'Technische kwaliteit en de beoogde intentie', ['Alleen de snelheid van praten', 'Alleen de trainingskleding', 'Dat elke set tot volledig falen gaat'], 'Krachtig coachen'],
  ['snelheid-signaal', 'Wat kan een duidelijke snelheidsdaling binnen een set signaleren?', 'Toenemende vermoeidheid of verlies van kwaliteit', ['Automatisch betere techniek', 'Dat rust nooit nodig is', 'Dat weerstand lager is geworden'], 'Snelheid als maat voor kwaliteit'],
  ['deelbewegingen', 'Waarom kijk je bij een bewegingsanalyse naar deelbewegingen?', 'Ze geven aanwijzingen over waar kwaliteit of energieverlies verandert', ['Ze maken de volledige beweging onbelangrijk', 'Ze vervangen observatie van techniek', 'Ze bepalen alleen de kledingkeuze'], 'De bewegingsanalyse'],
  ['energielek', 'Wat is een energielek in een krachtbeweging?', 'Een verlies van effectieve kracht door een minder optimale positie of uitvoering', ['Een geplande rustpauze', 'Een hogere trainingsfrequentie', 'Een warming-up zonder belasting'], 'Sticking point en energielek'],
  ['hoofdoefening', 'Waarop richt oefeningsselectie voor kracht zich in de eerste plaats?', 'Op de hoofdoefening en het gewenste bewegingspatroon', ['Op zoveel mogelijk willekeurige isolatie-oefeningen', 'Op de nieuwste apparatuur', 'Op minimale rust tussen alle sets'], 'Oefeningsselectie voor kracht'],
  ['core-kracht', 'Welke rol kan de core hebben bij kracht leveren?', 'Een stabiele basis bieden om kracht via de extremiteiten te leveren', ['Alleen de hartslag verhogen', 'Alleen de onderrug bewegen', 'De ademhaling volledig blokkeren'], 'Core'],
  ['unilateraal', 'Waarom kan unilateraal trainen nuttig zijn voor kracht?', 'Om verschillen, stabiliteit en specifieke posities gericht te trainen', ['Omdat beide zijden dan nooit werken', 'Omdat techniek niet meer relevant is', 'Omdat het altijd zwaarder is dan bilateraal trainen'], 'Unilateraal trainen voor kracht'],
  ['vermoeidheid-kwaliteit', 'Wat doe je als vermoeidheid de kwaliteit van een krachtbeweging aantast?', 'De belasting of oefenkeuze aanpassen om kwaliteit te bewaken', ['De techniek negeren en doorgaan', 'Altijd meer herhalingen toevoegen', 'Alle rust schrappen'], 'Vermoeidheid'],
  ['kracht-intensiteit', 'Welke intensiteit noemt de les als effectief voor maximale krachtadaptatie?', 'Zware belasting rond 80% van de 1RM of hoger', ['Alleen heel lichte belasting', 'Altijd precies 20% van de 1RM', 'Geen externe weerstand'], 'Intensiteit'],
  ['kracht-frequentie', 'Welk frequentiebereik is volgens de les vaak werkbaar per hoofdoefening?', 'Twee tot vier keer per week', ['Eén keer per maand', 'Elke dag zonder herstel', 'Alleen één keer per jaar'], 'Frequentie'],
  ['krachtvolume', 'Welke richtlijn noemt de les voor wekelijks krachtvolume bij intermediaire krachtsporters?', 'Vier tot tien directe sets per bewegingspatroon', ['Veertig tot zestig sets per dag', 'Nul sets per week', 'Alleen één set per maand'], 'Volume'],
  ['volume-flexibel', 'Welke variabele pas je volgens de les logischerwijs aan als intensiteit op een dag niet haalbaar is?', 'Het volume', ['De definitie van het doel', 'De 1RM van de cliënt', 'Alle slaapgewoonten'], 'Herstel'],
  ['herstel-pijlers', 'Welke hoort bij de vier pijlers van herstel uit de les?', 'Stressmanagement', ['Meer ongerichte vermoeidheid', 'Geen voeding na training', 'Alleen meetbare competitie'], 'Herstel'],
  ['beginner-kracht', 'Waar ligt bij een beginnende krachtsporter de nadruk?', 'Correcte bewegingspatronen aanleren met herhaling', ['Meteen maximale volumeprikkels', 'Alleen zeer hoge intensiteit', 'Elke week alle oefeningen wisselen'], 'Invloed van leeftijd op de programmering'],
  ['intermediair-kracht', 'Welke verandering past bij een intermediaire krachtsporter?', 'Meer specifieke oefening met hogere intensiteit en minder herhalingen', ['Geen techniek meer oefenen', 'Alleen lage intensiteit en hoge herhalingen', 'Minder aandacht voor herstel'], 'Invloed van leeftijd op de programmering'],
  ['warming-up-volgorde', 'Welke volgorde hoort bij de warming-up voor een hoofdoefening?', 'Algemeen, specifiek, opbouwsets en daarna werksets', ['Werksets, rust, algemene warming-up', 'Alleen passief rekken en direct testen', 'Eerst falen en daarna opwarmen'], 'Warming up'],
  ['mobiliteit', 'Wat betekent mobiliteit volgens de les?', 'Een actieve bewegingsuitslag die je sterk en stabiel kunt beheersen', ['Alleen passief zo ver mogelijk rekken', 'Een gewricht volledig stilhouden', 'Een hogere hartslag in rust'], 'Specifieke warming up'],
  ['activatie', 'Wat is een doel van spieractivatie in de warming-up?', 'De neuromusculaire verbinding en doorbloeding voorbereiden', ['Vermoeidheid maximaal verhogen', 'Alleen calorieën tellen', 'De hoofdoefening vervangen'], 'Specifieke warming up'],
  ['motor-engram', 'Wat is een motor engram?', 'Een opgeslagen motorisch patroon voor het uitvoeren van een vaardigheid', ['Een voedingsrichtlijn', 'Een type spiervezel', 'Een meeteenheid voor volume'], 'Opwarmen van de hoofdoefening'],
  ['kracht-beginsituatie', 'Wat maak je bij de beginsituatie voor krachtprogrammering concreet?', 'Het specifieke doel, de beweging en de belastbaarheid van de cliënt', ['Alleen een lijst met favoriete oefeningen', 'Alleen een eindgewicht zonder techniek', 'Alleen de rusthartslag'], 'Stappenplan programmeren'],
  ['weekprogramma', 'Wat programmeer je eerst wanneer je de trainingsweek invult?', 'Kwalitatieve sets voor de hoofdoefening, verspreid over de week', ['Willekeurige accessoires zonder hoofddoel', 'Alleen cooling-downs', 'Zo veel mogelijk supersets'], 'Stappenplan programmeren'],
  ['laatste-check', 'Wat controleer je in een laatste krachtprogrammeringscheck?', 'Of coaching aansluit op het energielek of sticking point en de cliënt op de taak focust', ['Alleen of de muziek aan staat', 'Of elke oefening dezelfde herhalingen heeft', 'Of de warming-up volledig ontbreekt'], 'Stappenplan programmeren'],
  ['kracht-leefstijl', 'Welke leefstijlfactoren ondersteunen volgens de les een krachttraject?', 'Voeding, slaap en stressmanagement', ['Alleen meer schermtijd', 'Alleen minder rust tussen sets', 'Alleen willekeurige supplementen'], 'Stappenplan programmeren']
].map(([id, prompt, answer, distractors, section]) => ({
  id: 'lesson-8-' + id, region: 'kracht', type: 'choice', prompt, answer, distractors,
  source: source('Les 8: Kracht maximaliseren', section)
}));

const coachingExtension = [
  ['kinetische-keten', 'Wat is een kinetische keten?', 'Een aaneenschakeling van gewrichten en spieren die energie overdraagt', ['Een losstaande spier zonder gewricht', 'Alleen een voedingsstrategie', 'Een rustperiode tussen sets'], 'Denken in bewegen'],
  ['hefboom-fulcrum', 'Wat is het fulcrum van een hefboom?', 'De rotatieas waar de beweging omheen plaatsvindt', ['De last die je wilt overwinnen', 'De spier die het hardst brandt', 'De rust tussen sets'], 'Denken in bewegen'],
  ['momentarm-impact', 'Wat gebeurt er met de impact van een moment als de momentarm groter wordt?', 'De impact van het moment wordt groter', ['De impact verdwijnt altijd', 'De beweging wordt automatisch stabieler', 'De zwaartekracht stopt'], 'Denken in bewegen'],
  ['line-of-pull', 'Wat beschrijft de line of pull?', 'De richting waarlangs een kracht trekt', ['Het aantal sets per week', 'De lengte van een warming-up', 'De slaapdruk van een cliënt'], 'Denken in bewegen'],
  ['lokale-vermoeidheid', 'Wat is lokale vermoeidheid?', 'Vermoeidheid die vooral binnen de werkende spiergroep ontstaat', ['Vermoeidheid die alleen door slaaptekort ontstaat', 'Een volledig rustmoment', 'Een hogere motivatie'], 'Programmeren'],
  ['globale-vermoeidheid', 'Wat is globale vermoeidheid?', 'Vermoeidheid die je door het hele lichaam ervaart', ['Alleen verzuring in één kleine spier', 'Een vaste trainingsmethode', 'Een techniek om doelen te stellen'], 'Programmeren'],
  ['anaeroob-alactisch', 'Welk energiesysteem levert zeer snel energie maar raakt snel uitgeput?', 'Anaeroob alactisch', ['Aeroob', 'Alleen het spijsverteringssysteem', 'Het circadiaanse ritme'], 'Meer over energie'],
  ['anaeroob-lactisch', 'Welk energiesysteem hoort volgens de les bij korte, zware inspanning met lokale vermoeidheid?', 'Anaeroob lactisch', ['Aeroob', 'Alleen homeostatische slaapdruk', 'Het immuunsysteem'], 'Meer over energie'],
  ['aeroob', 'Wat kenmerkt het aerobe energiesysteem?', 'Het kan langdurig energie leveren met zuurstof', ['Het levert geen energie', 'Het werkt alleen bij maximale sprints', 'Het is uitsluitend een coachingsmodel'], 'Meer over energie'],
  ['fitness-fatigue', 'Wat beschrijft het fitness-fatigue model over prestatie?', 'Prestatie wordt beïnvloed door fitness én door vermoeidheid die prestaties kan maskeren', ['Vermoeidheid heeft nooit effect op prestatie', 'Fitness is alleen spieromvang', 'Prestatie hangt alleen van motivatie af'], 'Structuur aanbrengen om progressie te maximaliseren'],
  ['adaptatie', 'Wat is een positieve adaptatie in training?', 'Een gerichte aanpassing aan een herhaalde trainingsprikkel', ['Een fout die je moet vermijden', 'Alleen vermoeidheid zonder herstel', 'Een willekeurige oefeningswissel'], 'Structuur aanbrengen om progressie te maximaliseren'],
  ['spiergroei-volume', 'Welke weekomvang noemt de les als richtlijn bij spiergroei?', 'Ongeveer twaalf tot achttien sets per spiergroep', ['Eén set per maand', 'Nul sets per week', 'Alleen honderd sets op één dag'], 'Spiergroei maximaliseren'],
  ['spiergroei-frequentie', 'Welke frequentie noemt de les vaak voor het trainen van een spier bij spiergroei?', 'Twee tot drie keer per week', ['Eén keer per jaar', 'Elke dag zonder herstel', 'Nooit dezelfde spier herhalen'], 'Spiergroei maximaliseren'],
  ['spiergroei-intentie', 'Waar richt de intentie van een effectieve set voor spiergroei zich op?', 'Dicht bij spierfalen werken met voldoende rust en herstel', ['Elke set zo kort mogelijk maken', 'Alleen trainen zonder weerstand', 'Geen herstel tussen sessies'], 'Spiergroei maximaliseren'],
  ['kracht-frequentie-2', 'Waarom is frequentie belangrijk voor submaximale kracht?', 'Omdat de specifieke vaardigheid vaker kwalitatief wordt geoefend', ['Omdat technische oefening dan niet meer nodig is', 'Omdat herstel nooit meer nodig is', 'Omdat volume altijd onbeperkt kan stijgen'], 'Programmeren: kracht'],
  ['kracht-transfer', 'Wat zijn ondersteunende oefeningen met hoge transferwaarde?', 'Oefeningen die sterk bijdragen aan de techniek of positie van de hoofdoefening', ['Oefeningen die geen verband hebben met het doel', 'Alleen oefeningen zonder belasting', 'Oefeningen die altijd exact hetzelfde zijn als de hoofdoefening'], 'Programmeren: kracht'],
  ['kracht-rust', 'Waarom is rust tussen zware krachtsets belangrijk?', 'Om hoog vermogen te kunnen leveren met zo min mogelijk vermoeidheid', ['Om meer lokale vermoeidheid op te bouwen', 'Om de techniek te negeren', 'Om de training willekeurig langer te maken'], 'Programmeren: kracht'],
  ['kracht-herstelvoorwaarden', 'Welke herstelvoorwaarden zijn volgens de les belangrijk bij krachtprogrammering?', 'Voldoende energie, eiwitten, slaap en beheersbare stress', ['Alleen meer cafeïne', 'Alleen extra accessoires', 'Alleen minder slaap'], 'Programmeren: kracht'],
  ['submaximaal-80', 'Wat benadrukt de les bij prestatieverbetering boven 80% van de 1RM?', 'Hoge oefenfrequentie met minimale vermoeidheid', ['Zo veel mogelijk uitputting per set', 'Alleen isolatie-oefeningen', 'Geen aandacht voor techniek'], 'Submaximaal kracht'],
  ['coachen-minder-zeggen', 'Welke coachingsstijl wordt in de les voor beter bewegen benadrukt?', 'Minder, heldere aanwijzingen geven en gericht observeren', ['Zo veel mogelijk aanwijzingen tegelijk geven', 'Nooit feedback geven', 'Alleen technische termen gebruiken'], 'Coachen naar beter bewegen'],
  ['coachingslus', 'Welke elementen horen bij de coachingslus?', 'Uitleggen, demonstreren, laten uitvoeren, observeren en feedback geven', ['Alleen een oefening noemen', 'Alleen een eindresultaat meten', 'Alleen corrigeren zonder uitleg'], 'Coaching is een vak apart'],
  ['extern-impliciet', 'Waarom gebruikt een coach externe en impliciete cues?', 'Om beweging begrijpelijk aan te leren zonder te veel technische details tegelijk', ['Om elke vorm van leren te vermijden', 'Om alle aandacht naar anatomische termen te sturen', 'Om feedback te vervangen'], 'Coaching is een vak apart']
].map(([id, prompt, answer, distractors, section]) => ({
  id: 'lesson-9-' + id, region: 'coaching', type: 'choice', prompt, answer, distractors,
  source: source('Les 9: Holistische benadering', section)
}));

export const advancedLessonQuestions = [
  ...nutrition, ...nutritionExtension,
  ...strength, ...strengthExtension,
  ...coaching, ...coachingExtension
];
