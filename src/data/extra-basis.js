// Additional questions tied to literal anchors in the supplied course text.
export const extraBasis = [
  ['posterieur', 'Wat betekent posterieur?', 'Aan de achterzijde van het lichaam', ['Aan de voorzijde van het lichaam', 'Richting de schedel', 'Naar de middenlijn toe'], 'Voorzijde ↔ achterzijde van het lichaam.'],
  ['superieur', 'Wat betekent superieur ten opzichte van een ander punt?', 'Hoger gelegen', ['Lager gelegen', 'Verder van de lichaamskern', 'Aan de achterzijde'], 'Hoger ↔ lager t.o.v. een ander punt.'],
  ['inferieur', 'Wat betekent inferieur ten opzichte van een ander punt?', 'Lager gelegen', ['Hoger gelegen', 'Dichter bij de lichaamskern', 'Naar de middenlijn toe'], 'Superieur ↔ Inferieur'],
  ['distaal', 'Wat betekent distaal?', 'Verder van de kern van het lichaam', ['Dichter bij de kern van het lichaam', 'Richting de schedel', 'Naar de middenlijn toe'], 'Dichter bij ↔ verder van de kern van het lichaam.'],
  ['lateraal', 'Wat betekent lateraal?', 'Van de middenlijn af', ['Naar de middenlijn toe', 'Richting het staartbeen', 'Hoger gelegen'], 'Naar de middenlijn toe ↔ van de middenlijn af.'],
  ['craniaal', 'Wat betekent craniaal?', 'Richting de schedel', ['Richting het staartbeen', 'Aan de achterzijde', 'Verder van de lichaamskern'], 'Richting schedel ↔ richting staartbeen.'],
  ['caudaal', 'Wat betekent caudaal?', 'Richting het staartbeen', ['Richting de schedel', 'Naar de middenlijn toe', 'Hoger gelegen'], 'Craniaal ↔ Caudaal'],
  ['unilateraal', 'Wat betekent unilateraal?', 'Eenzijdig', ['Tweezijdig', 'Aan de achterzijde', 'Naar buiten draaiend'], 'Eenzijdig ↔ tweezijdig.'],
  ['flexie', 'Welke beweging beschrijft flexie?', 'Buigen of bollen', ['Strekken of hollen', 'Naar buiten draaien', 'Opwaarts heffen'], 'Buigen/bollen ↔ strekken/hollen.'],
  ['extensie', 'Welke beweging beschrijft extensie?', 'Strekken of hollen', ['Buigen of bollen', 'Naar binnen draaien', 'Zijwaarts buigen'], 'Flexie ↔ Extensie'],
  ['anteflexie', 'Welke richting hoort bij anteflexie?', 'Naar voren of van het lichaam af', ['Naar achteren of terug naar het lichaam', 'Naar binnen draaien', 'Neerwaarts bewegen van de scapula'], 'Naar voren / van het lichaam af ↔ naar achteren /'],
  ['retroflexie', 'Welke richting hoort bij retroflexie?', 'Naar achteren of terug naar het lichaam', ['Naar voren of van het lichaam af', 'Van de middenlijn af', 'Opwaarts bewegen van de scapula'], 'Naar voren / van het lichaam af ↔ naar achteren /\nterug naar het lichaam.'],
  ['adductie', 'Hoe heet een beweging naar de middenlijn toe?', 'Adductie', ['Abductie', 'Exorotatie', 'Elevatie'], 'Van het midden af (wegvoeren) ↔ naar het midden\ntoe (aannemen).' ],
  ['endorotatie', 'Hoe heet naar binnen of intern draaien?', 'Endorotatie', ['Exorotatie', 'Lateroflexie', 'Retractie'], 'Naar binnen/intern draaien ↔ naar buiten/extern'],
  ['elevatie', 'Wat is elevatie van de scapula?', 'Opwaarts bewegen', ['Neerwaarts bewegen', 'Naar elkaar toe bewegen', 'Naar buiten draaien van de bovenarm'], '(scapula) Opwaarts ↔ neerwaarts.'],
  ['depressie', 'Wat is depressie van de scapula?', 'Neerwaarts bewegen', ['Opwaarts bewegen', 'Van elkaar af bewegen', 'Zijwaarts buigen van de romp'], 'Elevatie ↔ Depressie'],
  ['protractie', 'Wat is protractie van de scapulae?', 'De schouderbladen van elkaar af bewegen', ['De schouderbladen naar elkaar toe bewegen', 'De schouderbladen neerwaarts bewegen', 'De romp zijwaarts buigen'], '(scapula) Naar elkaar toe ↔ van elkaar af.'],
  ['laterorotatie', 'Wat betekent laterorotatie van de scapula?', 'Opwaarts roteren', ['Neerwaarts roteren', 'Naar elkaar toe bewegen', 'Naar beneden verplaatsen zonder rotatie'], '(scapula) Opwaarts roteren ↔ neerwaarts roteren.'],
  ['mediorotatie', 'Wat betekent mediorotatie van de scapula?', 'Neerwaarts roteren', ['Opwaarts roteren', 'Van elkaar af bewegen', 'Naar boven verplaatsen zonder rotatie'], 'Laterorotatie ↔ Mediorotatie'],
  ['lateroflexie', 'Wat is lateroflexie?', 'Zijwaarts buigen van de romp', ['Naar binnen draaien van de schouder', 'Strekken van de knie', 'Opwaarts roteren van de scapula'], 'Zijwaarts buigen van de romp.'],
  ['gewrichtsbeweging', 'Wat beschrijven termen als flexie en abductie?', 'Een gewrichtsbeweging waarbij de hoek tussen botsegmenten verandert', ['Een contractievorm van een spier', 'De plaats waar een pees aanhecht', 'De grootte van een spiervezel'], 'beschrijven de beweging van een gewricht'],
  ['functie-betekenis', 'Wat betekent de functie van een spier in een spiertabel?', 'De gewrichtsbeweging bij concentrisch samentrekken van die spier', ['De weerstandscurve van iedere oefening voor die spier', 'De plaats waar die spier maximaal verlengd is', 'De hoeveelheid trainingsvolume voor die spier'], 'gewrichtsbeweging ontstaat er als deze spier concentrisch samentrekt.'],
  ['spier-contractie', 'Op welke manieren kan een spier contraheren?', 'Contraheren: concentrisch, excentrisch of isometrisch', ['Zelf een gewricht zijn', 'Alleen concentrisch werken', 'Alleen ontspannen tijdens een beweging'], 'een spier kan alléén contraheren'],
  ['antagonist', 'Welke rol heeft de antagonist?', 'Tegenhanger van de beweging die moet ontspannen', ['Primaire spier die de beweging veroorzaakt', 'Helper die extra kracht of stabiliteit geeft', 'Het draaipunt van een hefboom'], 'Tegenhanger van de beweging — moet'],
  ['isometrisch-definitie', 'Wat blijft gelijk tijdens een isometrische contractie?', 'De spierlengte, terwijl er spanning is', ['De spierlengte, zonder enige spanning', 'De spierlengte neemt altijd toe', 'De spierlengte neemt altijd af'], 'Spanning zonder lengteverandering'],
  ['wall-sit', 'Welke contractievorm illustreert een wall sit?', 'Isometrisch', ['Concentrisch', 'Excentrisch', 'Geen spiercontractie'], 'Spanning zonder lengteverandering (plank, wall\nsit).'],
  ['deadlift-start', 'Met welke contractiefase begint een deadlift?', 'Concentrisch', ['Excentrisch', 'Isometrisch', 'Zonder spiercontractie'], 'Een deadlift begint concentrisch,'],
  ['eerste-fase', 'Is de eerste fase van iedere oefening concentrisch?', 'Nee, een squat begint bijvoorbeeld excentrisch', ['Ja, iedere eerste fase is concentrisch', 'Nee, iedere eerste fase is isometrisch', 'Ja, behalve wanneer er geen weerstand is'], 'de eerste fase van een oefening is niet altijd concentrisch.'],
  ['sagittaal-deling', 'Welke delen onderscheidt het sagittale vlak?', 'Links en rechts', ['Voor en achter', 'Boven en onder', 'Binnen en buiten een spier'], 'Deelt links/rechts. As: transversaal.'],
  ['sagittaal-as', 'Welke as hoort bij het sagittale vlak?', 'De transversale as', ['De sagittale as', 'De longitudinale as', 'De diagonale as'], 'Deelt links/rechts. As: transversaal.'],
  ['sagittaal-voorbeelden', 'Welke combinatie valt in het sagittale vlak?', 'Een lunge voor-achter en het been voorwaarts heffen', ['Een woodchop en romprotatie', 'Arm en been zijwaarts heffen', 'Alleen schouderprotractie en romprotatie'], 'Vb: lunge voor-achter, been'],
  ['frontaal-deling', 'Welke delen onderscheidt het frontale vlak?', 'Voor en achter', ['Links en rechts', 'Boven en onder', 'Proximaal en distaal'], 'Deelt voor/achter. As: sagittaal.'],
  ['frontaal-as', 'Welke as hoort bij het frontale vlak?', 'De sagittale as', ['De transversale as', 'De longitudinale as', 'De diagonale as'], 'Deelt voor/achter. As: sagittaal.'],
  ['frontaal-been', 'In welk vlak valt het zijwaarts heffen van een been?', 'Het frontale vlak', ['Het sagittale vlak', 'Het transversale vlak', 'Geen bewegingsvlak'], 'zijwaarts heffen van arm of been.'],
  ['transversaal-deling', 'Welke delen onderscheidt het transversale vlak?', 'Boven en onder', ['Voor en achter', 'Links en rechts', 'Mediaal en lateraal'], 'Deelt boven/onder. As: longitudinaal.'],
  ['transversaal-voorbeelden', 'Welke bewegingen vallen in het transversale vlak?', 'Woodchop en romprotatie', ['Lunge voor-achter en been voorwaarts heffen', 'Arm en been zijwaarts heffen', 'Leg extension en wall sit'], 'Vb: woodchop, romprotatie.'],
  ['keten-definitie', 'Wat is een kinetische keten?', 'Gewrichten en spieren die samenwerken voor één beweging', ['Eén spier die zonder gewrichten werkt', 'Een reeks oefeningen voor één spier', 'Een trainingsweek met dezelfde herhalingen'], 'Een kinetische keten is een reeks gewrichten en spieren'],
  ['keten-squat', 'Welke gewrichten vormen de kinetische keten bij een squat?', 'Enkel, knie en heup', ['Pols, elleboog en schouder', 'Schouder, pols en enkel', 'Alleen knie en elleboog'], 'enkel–knie–heup bij een squat'],
  ['keten-energie', 'Hoe stroomt de energie bij een golfswing?', 'Van voeten via heup en romp naar handen', ['Van handen direct naar voeten zonder romp', 'Alleen van pols naar elleboog', 'Alleen van knie naar enkel'], 'van voeten via heup en romp naar'],
  ['energielek-definitie', 'Wat is een energielek in een kinetische keten?', 'Verlies van energie of kracht, meestal door een technische fout', ['Een grotere spierlengte door rek', 'Een hogere belasting door een langere momentarm', 'Een bewuste pauze tussen twee sets'], 'Een energielek = verlies van energie/kracht'],
  ['open-segmenten', 'Welke segmenten zijn vast en vrij in een open keten?', 'Proximaal vast, distaal vrij', ['Proximaal vrij, distaal vast', 'Alle segmenten vast', 'Alle segmenten bewegen gelijktijdig'], 'Proximaal segment vast, distaal segment vrij'],
  ['open-kenmerken', 'Wat kenmerkt een open-ketenoefening?', 'Gewrichtsspecifiek, één segment beweegt, stabiliteit minder belangrijk', ['Meerdere segmenten bewegen, stabiliteit cruciaal', 'Geen gewrichtsbeweging, alleen isometrische spanning', 'Alleen een natuurlijke beweging zonder isolatie'], 'Gewrichtsspecifiek, stabiliteit minder belangrijk'],
  ['open-isolatie', 'Welke combinatie hoort bij een open keten?', 'Isolatie-oefening in een enkel bewegingsvlak', ['Compound-oefening in meerdere vlakken', 'Co-contractie met meerdere bewegende segmenten', 'Altijd uitsluitend een isometrische oefening'], 'Isolatie-oefening, enkel bewegingsvlak'],
  ['gesloten-beweging', 'Hoe bewegen segmenten in een gesloten keten?', 'Meerdere segmenten gelijktijdig in een voorspelbaar patroon', ['Alleen één vrij distaal segment', 'Geen enkel segment verandert van positie', 'Ieder segment zonder samenhang met de rest'], 'Meerdere segmenten bewegen gelijktijdig, voorspelbaar patroon'],
  ['gesloten-stabiliteit', 'Welke rol heeft stabiliteit in een gesloten keten?', 'Cruciaal bij het nabootsen van natuurlijke beweging', ['Minder belangrijk dan bij iedere open keten', 'Overbodig omdat de gewrichten niet bewegen', 'Alleen relevant bij de pols'], 'Bootst natuurlijke beweging na, stabiliteit cruciaal'],
  ['gesloten-voorbeeld', 'Welke combinatie hoort bij een gesloten keten?', 'Squat: compound, co-contractie en meerdere vlakken', ['Leg extension: isolatie en één bewegingsvlak', 'Wall sit: één vrij bewegend distaal segment', 'Curl: uitsluitend schouderrotatie'], 'Compound, co-contractie, meerdere vlakken (bv. squat)'],
  ['anterior-chain', 'Welke spieren vormen de anterior chain?', 'Pectoralis, heupflexoren, buikspieren en quadriceps', ['Kuiten, hamstrings, gluteus, latissimus en erector spinae', 'Biceps, triceps, kuiten en hamstrings', 'Alleen latissimus en erector spinae'], 'Anterior chain: pectoralis, heupflexoren, buikspieren, quadriceps.'],
  ['posterior-chain', 'Welke spieren vormen de posterior chain?', 'Kuiten, hamstrings, gluteus, latissimus en erector spinae', ['Pectoralis, heupflexoren, buikspieren en quadriceps', 'Alleen quadriceps en pectoralis', 'Biceps, pectoralis en rectus abdominis'], 'Posterior chain: kuiten, hamstrings,'],
  ['momentarm-definitie', 'Wat is de momentarm?', 'Afstand tussen het aangrijpingspunt van de kracht en het draaipunt', ['De lengte van de gehele spier', 'De afstand tussen twee sets', 'De snelheid waarmee een gewicht beweegt'], 'de afstand tussen het aangrijpingspunt van de kracht'],
  ['momentarm-compensatie', 'Wat vraagt een langere momentarm bij dezelfde kracht van de spieren?', 'Meer spierkracht om te compenseren', ['Minder spierkracht om te compenseren', 'Geen spanning meer', 'Altijd dezelfde spierkracht'], 'hoe meer spierkracht er nodig is om te compenseren.'],
  ['primaire-hefboom', 'Hoe liggen de onderdelen bij een primaire hefboom?', 'Het fulcrum ligt tussen inspanning en last', ['De last ligt tussen fulcrum en inspanning', 'De inspanning ligt tussen fulcrum en last', 'Fulcrum en last zijn hetzelfde punt'], 'Fulcrum tussen inspanning en last.'],
  ['primaire-voorbeeld', 'Wat is een voorbeeld van een primaire hefboom?', 'Een wip', ['Een kruiwagen', 'De elleboog bij een curl', 'Een leg extension als open keten'], 'wip. Gelijke afstand = gelijke kracht'],
  ['primaire-afstand', 'Wat geldt bij gelijke afstanden tussen draaipunt, inspanning en last op een wip?', 'Er is gelijke kracht nodig', ['Er is altijd tweemaal zoveel kracht nodig', 'Er is geen kracht nodig', 'De last moet altijd in het midden liggen'], 'Gelijke afstand = gelijke kracht'],
  ['secundaire-hefboom', 'Hoe liggen de onderdelen bij een secundaire hefboom?', 'De last ligt tussen fulcrum en inspanning', ['Het fulcrum ligt tussen inspanning en last', 'De inspanning ligt tussen fulcrum en last', 'De inspanning en het fulcrum vallen altijd samen'], 'Last tussen fulcrum en inspanning.'],
  ['secundaire-voorbeeld', 'Wat is een voorbeeld van een secundaire hefboom?', 'Een kruiwagen', ['Een wip', 'De elleboog bij een curl', 'Een woodchop in het transversale vlak'], 'kruiwagen. Last dicht bij fulcrum'],
  ['secundaire-last', 'Wat gebeurt er als de last in een kruiwagen dichter bij het fulcrum zit?', 'Je kunt meer tillen', ['Je kunt minder tillen', 'De hefboom wordt tertiair', 'De inspanning verdwijnt volledig'], 'kruiwagen. Last dicht bij fulcrum =\nmeer te tillen.'],
  ['tertiaire-hefboom', 'Hoe liggen de onderdelen bij een tertiaire hefboom?', 'De inspanning ligt tussen fulcrum en last', ['De last ligt tussen fulcrum en inspanning', 'Het fulcrum ligt tussen inspanning en last', 'Last en fulcrum zijn hetzelfde punt'], 'Inspanning tussen fulcrum en last'],
  ['tertiaire-voorbeeld', 'Welke lichaamshefboom is tertiair?', 'De elleboog bij een curl', ['De wip', 'De kruiwagen', 'Alleen de romp bij een wall sit'], '(bv. elleboog bij curl).'],
  ['tertiaire-eigenschappen', 'Welke afweging hoort bij tertiaire hefbomen?', 'Ze kosten veel kracht en geven snelheid en bereik', ['Ze kosten weinig kracht en geven geen bereik', 'Ze geven alleen stabiliteit zonder beweging', 'Ze verminderen altijd snelheid en bereik'], 'Kost veel kracht,'],
  ['lowbar-heup', 'Welk gewricht wordt het meest belast door de lange momentarm bij een low bar back squat?', 'De heup', ['De knie', 'De elleboog', 'De pols'], 'bij de low bar back squat is de moment arm op de heup het langst'],
  ['frontsquat-knie', 'Welk gewricht wordt het meest belast door de lange momentarm bij een front squat?', 'De knie', ['De heup', 'De schouder', 'De pols'], 'Bij de front squat is de moment arm op de knie het langst'],
  ['goodmorning', 'Waar ontstaan grote momentarmen bij een good morning?', 'Bij de heup en de onderrug', ['Bij de elleboog en de pols', 'Alleen bij de knie', 'Alleen bij de schouder'], 'de good morning is de moment arm op zowel heup als onderrug groot'],
  ['curve-definitie', 'Wat beschrijft een weerstandscurve?', 'Hoe de weerstand verandert tijdens de beweging', ['Hoe de spier anatomisch aanhecht', 'Hoeveel dagen een microcyclus duurt', 'Hoeveel verschillende spieren er zijn'], 'De weerstandscurve beschrijft hoe de weerstand verandert tijdens de beweging.'],
  ['curve-direct', 'Wanneer is de weerstand hoog ten opzichte van de bewegingsrichting?', 'Wanneer je direct tegen de weerstand in beweegt', ['Wanneer je volledig met de weerstand mee beweegt', 'Wanneer je geen gewicht gebruikt', 'Wanneer de krachtlijn geen moment veroorzaakt'], 'waar je direct tegen de weerstand in beweegt'],
  ['curve-afstand', 'Waar ligt het gewicht ten opzichte van het fulcrum bij de hoogste weerstand?', 'Het gewicht is het verst van het fulcrum', ['Het gewicht valt samen met het fulcrum', 'Het gewicht is altijd het dichtst bij het fulcrum', 'De afstand tot het fulcrum speelt nooit een rol'], 'waar het gewicht het verst van het fulcrum is'],
  ['curve-kabel', 'Welke segmentpositie geeft hoge weerstand bij een kabel?', 'Haaks op de kabel', ['Parallel aan de kabel', 'Altijd verticaal ongeacht de kabel', 'Alleen wanneer het segment stilstaat'], 'het segment haaks op de kabel staat'],
  ['curve-vrijgewicht', 'Welke segmentpositie geeft hoge weerstand bij een vrij gewicht?', 'Parallel aan de grond', ['Altijd verticaal', 'Parallel aan de kabel', 'Altijd zo dicht mogelijk bij het fulcrum'], 'parallel aan de grond is (vrij gewicht).'],
  ['oplopende-curve', 'Hoe verloopt een oplopende weerstandscurve?', 'Weerstand groeit naar het eind, vaak met de verkorte positie als zwaarste', ['Weerstand daalt naar het eind, vaak met de verlengde positie als zwaarste', 'Weerstand piekt in het midden en daalt aan beide kanten', 'Weerstand blijft overal exact gelijk'], 'Weerstand groeit richting het eind'],
  ['oplopend-voorbeelden', 'Welke voorbeelden horen bij een oplopende curve?', 'Cable fly en leg extension', ['DB flat press en overhead extension', 'Staande lateral raise en dumbbell curl', 'Alleen plank en wall sit'], 'cable fly, leg extension'],
  ['aflopende-curve', 'Hoe verloopt een aflopende weerstandscurve?', 'Weerstand daalt naar het eind, vaak met de verlengde positie als zwaarste', ['Weerstand groeit naar het eind, vaak met de verkorte positie als zwaarste', 'Weerstand piekt uitsluitend in het midden', 'Weerstand blijft overal exact gelijk'], 'Weerstand neemt af richting het eind'],
  ['aflopend-voorbeelden', 'Welke voorbeelden horen bij een aflopende curve?', 'DB flat press en overhead extension', ['Cable fly en leg extension', 'Staande lateral raise en dumbbell curl', 'Alleen leg extension en wall sit'], 'db flat press, overhead extension'],
  ['bell-voorbeelden', 'Welke voorbeelden horen bij een bell-shaped curve?', 'Staande lateral raise en dumbbell curl', ['Cable fly en leg extension', 'DB flat press en overhead extension', 'Alleen plank en wall sit'], 'staande\nlat raise, curl met db'],
  ['curve-combinatie', 'Welke weerstandscurves combineer je om de volledige spierlengte te belasten?', 'Oplopend en aflopend, eventueel aangevuld met bell-shaped', ['Alleen drie identieke oplopende varianten', 'Alleen oefeningen in de verkorte positie', 'Alleen isometrische oefeningen zonder lengteverschil'], 'Combineer daarom bewust een oplopende + aflopende'],
  ['verlengde-positie', 'Wat betekent de verlengde spierpositie?', 'De spier is maximaal op rek', ['De spier vervult alle functies in de verkorte positie', 'De spier is noch maximaal verlengd noch verkort', 'Er is geen spierspanning mogelijk'], 'Verlengde positie — spier maximaal op rek.'],
  ['passieve-insufficientie', 'Wat is passieve insufficiëntie?', 'Een bi- of tri-articulaire spier kan moeilijk over meerdere gewrichten tegelijk verlengen', ['Een spier kan moeilijk over meerdere gewrichten tegelijk verkorten', 'Een spier kan alleen over één gewricht concentrisch werken', 'Een spier heeft in de middenpositie geen spanning'], 'spier heeft moeite om over meerdere gewrichten tegelijk te verlengen.'],
  ['middenpositie', 'Wat is de middenpositie van een spier?', 'Niet maximaal verlengd of verkort; vaak de sterkste, meest neutrale positie', ['Maximaal verlengd en altijd zonder spanning', 'Maximaal verkort en altijd de zwakste positie', 'Een positie waarin alle gewrichten stilstaan'], 'Middenpositie — niet maximaal verlengd of verkort.'],
  ['verkorte-positie', 'Wat is de verkorte spierpositie?', 'De spier vervult alle functies', ['De spier staat maximaal op rek', 'De spier is niet maximaal verlengd of verkort', 'De spier kan geen spanning leveren'], 'Verkorte positie — spier vervult alle functies.'],
  ['actieve-voorbeeld', 'Wat is een voorbeeld van actieve insufficiëntie van de hamstrings?', 'Knie buigen met een gestrekte heup', ['Knie strekken met een gebogen heup', 'Schouder abductie met een gestrekte knie', 'Enkel dorsaalflexie met een gebogen elleboog'], 'hamstrings knie buigen mét\ngestrekte heup'],
  ['rom-onderlichaam', 'Welke ROM heeft voor het onderlichaam vrijwel altijd de voorkeur?', 'Full ROM boven partial ROM', ['Partial ROM boven full ROM', 'Alleen isometrische spanning', 'ROM speelt nooit een rol'], 'Full ROM werkt voor het onderlichaam vrijwel altijd beter dan partial ROM.'],
  ['motor-resultaat', 'Hoe hangen spiercontractie en gewrichtsbeweging samen?', 'De spier is de motor en de gewrichtsbeweging het resultaat', ['Het gewricht is de motor en spiercontractie is onmogelijk', 'Een spier kan alleen passief bewegen zonder contractie', 'De gewrichtsbeweging bepaalt altijd de oorsprong van de spier'], 'De spier is de motor, de'],
  ['tertiaire-meerderheid', 'Welk type hefboom komt bij de meeste gewrichten voor?', 'Tertiair', ['Primair', 'Secundair', 'Alleen een hefboom zonder fulcrum'], 'de meeste gewrichten in het lichaam'],
  ['goodmorning-chain', 'Welke keten wordt zwaar belast bij de good morning?', 'De posterior chain', ['Alleen de anterior chain', 'Alleen de armketen', 'Alleen de schouderketen'], 'zware belasting posterior\nchain.'],
  ['bell-uiteinden', 'Hoe verhouden begin en eind zich tot het midden bij een bell-shaped curve?', 'Begin en eind zijn lichter dan het midden', ['Begin en eind zijn zwaarder dan het midden', 'Alleen het eind is zwaarder dan het midden', 'Alle posities zijn even zwaar'], 'begin en eind zijn lichter'],
  ['range-dekking', 'Dekken drie losse oefeningen vanzelf de hele range?', 'Nee, dat gebeurt zelden; combineer bewust verschillende curves', ['Ja, ieder drietal dekt automatisch de hele range', 'Ja, zolang alle drie dezelfde curve hebben', 'Nee, een spier kan nooit in de verlengde positie worden belast'], '3 losse oefeningen dekken zelden de héle range.'],
  ['rom-bovenlichaam', 'Hoe gebruik je full en partial ROM voor het bovenlichaam?', 'Beide werken; daag de spier ook in de verlengde positie uit', ['Alleen partial ROM werkt en rek is overbodig', 'Alleen full ROM werkt, ongeacht de spierpositie', 'Vermijd belasting in de verlengde positie'], 'Voor het bovenlichaam\nwerken beide']
].map(([key, prompt, answer, distractors, anchor]) => ({
  id: `extra-basis-${key}`, region: 'basis', prompt, answer, distractors, anchor
}));

// Source learning units mapped to independently addressable questions.
export const basisCoverage = [
  {
    "id": "basis-unit-1",
    "label": "Anterieur / posterieur",
    "questionIds": [
      "concept-0",
      "extra-basis-posterieur"
    ]
  },
  {
    "id": "basis-unit-2",
    "label": "Superieur / inferieur",
    "questionIds": [
      "extra-basis-superieur",
      "extra-basis-inferieur"
    ]
  },
  {
    "id": "basis-unit-3",
    "label": "Proximaal / distaal",
    "questionIds": [
      "concept-1",
      "extra-basis-distaal"
    ]
  },
  {
    "id": "basis-unit-4",
    "label": "Mediaal / lateraal",
    "questionIds": [
      "concept-2",
      "extra-basis-lateraal"
    ]
  },
  {
    "id": "basis-unit-5",
    "label": "Craniaal / caudaal",
    "questionIds": [
      "extra-basis-craniaal",
      "extra-basis-caudaal"
    ]
  },
  {
    "id": "basis-unit-6",
    "label": "Unilateraal / bilateraal",
    "questionIds": [
      "extra-basis-unilateraal",
      "concept-3"
    ]
  },
  {
    "id": "basis-unit-7",
    "label": "Flexie / extensie",
    "questionIds": [
      "extra-basis-flexie",
      "extra-basis-extensie"
    ]
  },
  {
    "id": "basis-unit-8",
    "label": "Anteflexie / retroflexie",
    "questionIds": [
      "extra-basis-anteflexie",
      "extra-basis-retroflexie"
    ]
  },
  {
    "id": "basis-unit-9",
    "label": "Abductie / adductie",
    "questionIds": [
      "concept-4",
      "extra-basis-adductie"
    ]
  },
  {
    "id": "basis-unit-10",
    "label": "Endorotatie / exorotatie",
    "questionIds": [
      "extra-basis-endorotatie",
      "concept-6"
    ]
  },
  {
    "id": "basis-unit-11",
    "label": "Scapula elevatie / depressie",
    "questionIds": [
      "extra-basis-elevatie",
      "extra-basis-depressie"
    ]
  },
  {
    "id": "basis-unit-12",
    "label": "Scapula retractie / protractie",
    "questionIds": [
      "concept-5",
      "extra-basis-protractie"
    ]
  },
  {
    "id": "basis-unit-13",
    "label": "Scapula laterorotatie / mediorotatie",
    "questionIds": [
      "extra-basis-laterorotatie",
      "extra-basis-mediorotatie"
    ]
  },
  {
    "id": "basis-unit-14",
    "label": "Lateroflexie",
    "questionIds": [
      "extra-basis-lateroflexie"
    ]
  },
  {
    "id": "basis-unit-15",
    "label": "Gewrichtsbeweging, hoek botsegmenten; contractie versus beweging",
    "questionIds": [
      "extra-basis-gewrichtsbeweging",
      "extra-basis-spier-contractie"
    ]
  },
  {
    "id": "basis-unit-16",
    "label": "Meaning of muscle function in the tables; muscle as motor",
    "questionIds": [
      "extra-basis-functie-betekenis",
      "extra-basis-motor-resultaat"
    ]
  },
  {
    "id": "basis-unit-17",
    "label": "Agonist, antagonist, synergist",
    "questionIds": [
      "concept-7",
      "extra-basis-antagonist",
      "concept-8"
    ]
  },
  {
    "id": "basis-unit-18",
    "label": "Concentrisch / excentrisch",
    "questionIds": [
      "concept-9",
      "concept-10"
    ]
  },
  {
    "id": "basis-unit-19",
    "label": "Isometrisch definition, plank and wall sit",
    "questionIds": [
      "extra-basis-isometrisch-definitie",
      "concept-11",
      "extra-basis-wall-sit"
    ]
  },
  {
    "id": "basis-unit-20",
    "label": "First phase need not be concentric; deadlift versus squat",
    "questionIds": [
      "extra-basis-eerste-fase",
      "extra-basis-deadlift-start",
      "concept-42"
    ]
  },
  {
    "id": "basis-unit-21",
    "label": "Sagittaal: division, axis, lunge and forward leg lift",
    "questionIds": [
      "extra-basis-sagittaal-deling",
      "extra-basis-sagittaal-as",
      "extra-basis-sagittaal-voorbeelden"
    ]
  },
  {
    "id": "basis-unit-22",
    "label": "Frontaal: division, axis, sideways arm/leg lift",
    "questionIds": [
      "extra-basis-frontaal-deling",
      "extra-basis-frontaal-as",
      "concept-12",
      "extra-basis-frontaal-been"
    ]
  },
  {
    "id": "basis-unit-23",
    "label": "Transversaal: division, axis, woodchop and trunk rotation",
    "questionIds": [
      "extra-basis-transversaal-deling",
      "concept-13",
      "extra-basis-transversaal-voorbeelden"
    ]
  },
  {
    "id": "basis-unit-24",
    "label": "Kinetic-chain definition, ankle–knee–hip squat, energy flow in golf, leak",
    "questionIds": [
      "extra-basis-keten-definitie",
      "extra-basis-keten-squat",
      "extra-basis-keten-energie",
      "extra-basis-energielek-definitie"
    ]
  },
  {
    "id": "basis-unit-25",
    "label": "Open chain: proximal fixed/distal free, one segment, joint-specific, stability, isolation/single plane, leg extension",
    "questionIds": [
      "extra-basis-open-segmenten",
      "extra-basis-open-kenmerken",
      "extra-basis-open-isolatie",
      "concept-14"
    ]
  },
  {
    "id": "basis-unit-26",
    "label": "Closed chain: simultaneous segments, predictable pattern, natural movement/stability, compound/co-contraction/multiple planes, squat",
    "questionIds": [
      "extra-basis-gesloten-beweging",
      "extra-basis-gesloten-stabiliteit",
      "extra-basis-gesloten-voorbeeld"
    ]
  },
  {
    "id": "basis-unit-27",
    "label": "Anterior / posterior chain membership",
    "questionIds": [
      "extra-basis-anterior-chain",
      "extra-basis-posterior-chain"
    ]
  },
  {
    "id": "basis-unit-28",
    "label": "Moment formula and moment-arm definition",
    "questionIds": [
      "concept-15",
      "extra-basis-momentarm-definitie"
    ]
  },
  {
    "id": "basis-unit-29",
    "label": "Longer moment arm, greater moment and muscle-force compensation",
    "questionIds": [
      "concept-16",
      "extra-basis-momentarm-compensatie"
    ]
  },
  {
    "id": "basis-unit-30",
    "label": "Primary lever geometry, wip, equal distance/equal force",
    "questionIds": [
      "extra-basis-primaire-hefboom",
      "extra-basis-primaire-voorbeeld",
      "extra-basis-primaire-afstand"
    ]
  },
  {
    "id": "basis-unit-31",
    "label": "Secondary lever geometry, kruiwagen, load near fulcrum",
    "questionIds": [
      "extra-basis-secundaire-hefboom",
      "extra-basis-secundaire-voorbeeld",
      "extra-basis-secundaire-last"
    ]
  },
  {
    "id": "basis-unit-32",
    "label": "Tertiary geometry, elbow curl, majority of joints, force/speed/range tradeoff",
    "questionIds": [
      "extra-basis-tertiaire-hefboom",
      "extra-basis-tertiaire-voorbeeld",
      "extra-basis-tertiaire-meerderheid",
      "extra-basis-tertiaire-eigenschappen"
    ]
  },
  {
    "id": "basis-unit-33",
    "label": "Low-bar squat hip load; front-squat knee load; good-morning hip/lower-back/posterior load",
    "questionIds": [
      "extra-basis-lowbar-heup",
      "extra-basis-frontsquat-knie",
      "extra-basis-goodmorning",
      "extra-basis-goodmorning-chain"
    ]
  },
  {
    "id": "basis-unit-34",
    "label": "Resistance-curve definition; direct opposition; distance; cable/free-weight geometry",
    "questionIds": [
      "extra-basis-curve-definitie",
      "extra-basis-curve-direct",
      "extra-basis-curve-afstand",
      "extra-basis-curve-kabel",
      "extra-basis-curve-vrijgewicht"
    ]
  },
  {
    "id": "basis-unit-35",
    "label": "Ascending curve and cable-fly/leg-extension examples",
    "questionIds": [
      "extra-basis-oplopende-curve",
      "extra-basis-oplopend-voorbeelden"
    ]
  },
  {
    "id": "basis-unit-36",
    "label": "Descending curve and DB-flat-press/overhead-extension examples",
    "questionIds": [
      "extra-basis-aflopende-curve",
      "extra-basis-aflopend-voorbeelden"
    ]
  },
  {
    "id": "basis-unit-37",
    "label": "Bell-shaped middle peak, lighter ends, standing-lateral-raise/DB-curl examples",
    "questionIds": [
      "concept-17",
      "extra-basis-bell-uiteinden",
      "extra-basis-bell-voorbeelden"
    ]
  },
  {
    "id": "basis-unit-38",
    "label": "Three arbitrary exercises rarely cover whole range; deliberate curve combination",
    "questionIds": [
      "extra-basis-range-dekking",
      "extra-basis-curve-combinatie"
    ]
  },
  {
    "id": "basis-unit-39",
    "label": "Lengthened position and passive insufficiency of multiarticular muscles",
    "questionIds": [
      "extra-basis-verlengde-positie",
      "extra-basis-passieve-insufficientie"
    ]
  },
  {
    "id": "basis-unit-40",
    "label": "Middle position and usual strength/neutrality",
    "questionIds": [
      "extra-basis-middenpositie"
    ]
  },
  {
    "id": "basis-unit-41",
    "label": "Shortened position, active insufficiency and hamstring example",
    "questionIds": [
      "extra-basis-verkorte-positie",
      "concept-18",
      "extra-basis-actieve-voorbeeld"
    ]
  },
  {
    "id": "basis-unit-42",
    "label": "Full versus partial ROM in lower/upper body and lengthened challenge",
    "questionIds": [
      "extra-basis-rom-onderlichaam",
      "extra-basis-rom-bovenlichaam"
    ]
  }
];
