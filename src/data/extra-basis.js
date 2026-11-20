// Additional questions tied to literal anchors in the supplied course text.
export const extraBasis = [
  ['posterieur', 'Wat betekent posterieur?', 'Aan de achterzijde van het lichaam', ['Aan de voorzijde van het lichaam', 'Richting de schedel', 'Naar de middenlijn toe'], 'Voorzijde ↔ achterzijde van het lichaam.'],
  ['superieur', 'Wat betekent superieur ten opzichte van een ander punt?', 'Hoger gelegen', ['Lager gelegen', 'Verder van de lichaamskern', 'Aan de achterzijde'], 'Hoger ↔ lager t.o.v. een ander punt.'],
  ['inferieur', 'Wat betekent inferieur ten opzichte van een ander punt?', 'Lager gelegen', ['Hoger gelegen', 'Dichter bij de lichaamskern', 'Naar de middenlijn toe'], 'Superieur ↔ Inferieur'],
  ['distaal', 'Wat betekent distaal?', 'Verder van de kern van het lichaam', ['Dichter bij de kern van het lichaam', 'Richting de schedel', 'Naar de middenlijn toe'], 'Dichter bij ↔ verder van de kern van het lichaam.'],
  ['lateraal', 'Wat betekent lateraal?', 'Van de middenlijn af', ['Naar de middenlijn toe', 'Richting het staartbeen', 'Hoger gelegen'], 'Naar de middenlijn toe ↔ van de middenlijn af.'],
  ['craniaal', 'Wat betekent craniaal?', 'Richting de schedel', ['Richting het staartbeen', 'Aan de achterzijde', 'Verder van de lichaamskern'], 'Richting schedel ↔ richting staartbeen.'],
  ['caudaal', 'Wat betekent caudaal?', 'Richting het staartbeen', ['Richting de schedel', 'Naar de middenlijn toe', 'Hoger gelegen'], 'Craniaal ↔ Caudaal'],
  ['unilateraal', 'Wat betekent unilateraal?', 'Eenzijdig', ['Tweezijdig', 'Aan de achterzijde', 'Verder van de kern'], 'Eenzijdig ↔ tweezijdig.'],
  ['flexie', 'Welke beweging beschrijft flexie?', 'Buigen of bollen', ['Strekken of hollen', 'Naar de middenlijn toe bewegen', 'Zijwaarts buigen of hellen'], 'Buigen/bollen ↔ strekken/hollen.'],
  ['extensie', 'Welke beweging beschrijft extensie?', 'Strekken of hollen', ['Buigen of bollen', 'Van de middenlijn af bewegen', 'Zijwaarts buigen of hellen'], 'Flexie ↔ Extensie'],
  ['anteflexie', 'Welke richting hoort bij anteflexie?', 'Naar voren of van het lichaam af', ['Naar achteren of terug naar het lichaam', 'Naar boven of van de middenlijn af', 'Naar binnen of naar de middenlijn toe'], 'Naar voren / van het lichaam af ↔ naar achteren /'],
  ['retroflexie', 'Welke richting hoort bij retroflexie?', 'Naar achteren of terug naar het lichaam', ['Naar voren of van het lichaam af', 'Naar buiten of van de middenlijn af', 'Naar binnen of naar de middenlijn toe'], 'Naar voren / van het lichaam af ↔ naar achteren /\nterug naar het lichaam.'],
  ['adductie', 'Hoe heet een beweging naar de middenlijn toe?', 'Adductie', ['Abductie', 'Anteflexie', 'Exorotatie'], 'Van het midden af (wegvoeren) ↔ naar het midden\ntoe (aannemen).' ],
  ['endorotatie', 'Hoe heet naar binnen of intern draaien?', 'Endorotatie', ['Exorotatie', 'Adductie', 'Retractie'], 'Naar binnen/intern draaien ↔ naar buiten/extern'],
  ['elevatie', 'Wat is elevatie van de scapula?', 'Opwaarts bewegen', ['Neerwaarts bewegen', 'Naar elkaar toe bewegen', 'Van elkaar af bewegen'], '(scapula) Opwaarts ↔ neerwaarts.'],
  ['depressie', 'Wat is depressie van de scapula?', 'Neerwaarts bewegen', ['Opwaarts bewegen', 'Van elkaar af bewegen', 'Naar elkaar toe bewegen'], 'Elevatie ↔ Depressie'],
  ['protractie', 'Wat is protractie van de scapulae?', 'De schouderbladen van elkaar af bewegen', ['De schouderbladen naar elkaar toe bewegen', 'De schouderbladen neerwaarts bewegen', 'De schouderbladen opwaarts bewegen'], '(scapula) Naar elkaar toe ↔ van elkaar af.'],
  ['laterorotatie', 'Wat betekent laterorotatie van de scapula?', 'Opwaarts roteren', ['Neerwaarts roteren', 'Opwaarts bewegen zonder rotatie', 'Van elkaar af bewegen'], '(scapula) Opwaarts roteren ↔ neerwaarts roteren.'],
  ['mediorotatie', 'Wat betekent mediorotatie van de scapula?', 'Neerwaarts roteren', ['Opwaarts roteren', 'Neerwaarts bewegen zonder rotatie', 'Naar elkaar toe bewegen'], 'Laterorotatie ↔ Mediorotatie'],
  ['lateroflexie', 'Wat is lateroflexie?', 'Zijwaarts buigen van de romp', ['Voorwaarts buigen van de romp', 'Naar achteren buigen van de romp', 'Draaien van de romp rond de lengteas'], 'Zijwaarts buigen van de romp.'],
  ['gewrichtsbeweging', 'Wat beschrijven termen als flexie en abductie?', 'Een gewrichtsbeweging waarbij de hoek tussen botsegmenten verandert', ['Een contractievorm waarbij de spierlengte verandert', 'Een aanhechtingsplaats van een spier aan het bot', 'Een bewegingsvlak waarin het lichaam wordt verdeeld'], 'beschrijven de beweging van een gewricht'],
  ['functie-betekenis', 'Wat betekent de functie van een spier in een spiertabel?', 'De gewrichtsbeweging bij concentrisch samentrekken van die spier', ['De gewrichtsbeweging bij excentrisch verlengen van die spier', 'De gewrichtsstand waarin die spier maximaal op rek staat', 'De oefening waarin die spier het meest wordt belast'], 'gewrichtsbeweging ontstaat er als deze spier concentrisch samentrekt.'],
  ['spier-contractie', 'Op welke manieren kan een spier contraheren?', 'Contraheren: concentrisch, excentrisch of isometrisch', ['Contraheren: concentrisch, isometrisch of plyometrisch', 'Contraheren: flexie, extensie of rotatie', 'Contraheren: open, gesloten of halfopen'], 'een spier kan alléén contraheren'],
  ['antagonist', 'Welke rol heeft de antagonist?', 'Tegenhanger van de beweging die moet ontspannen', ['Primaire spier die de beweging veroorzaakt', 'Helper die extra kracht of stabiliteit geeft', 'Stabilisator die het gewricht tijdens de beweging vastzet'], 'Tegenhanger van de beweging — moet'],
  ['isometrisch-definitie', 'Wat blijft gelijk tijdens een isometrische contractie?', 'De spierlengte, terwijl er spanning is', ['De spierlengte, terwijl de spanning wegvalt', 'De spanning, terwijl de spier verlengt', 'De spanning, terwijl de spier verkort'], 'Spanning zonder lengteverandering'],
  ['wall-sit', 'Welke contractievorm illustreert een wall sit?', 'Isometrisch', ['Concentrisch', 'Excentrisch', 'Plyometrisch'], 'Spanning zonder lengteverandering (plank, wall\nsit).'],
  ['deadlift-start', 'Met welke contractiefase begint een deadlift?', 'Concentrisch', ['Excentrisch', 'Isometrisch', 'Plyometrisch'], 'Een deadlift begint concentrisch,'],
  ['eerste-fase', 'Is de eerste fase van iedere oefening concentrisch?', 'Nee, een squat begint bijvoorbeeld excentrisch', ['Ja, een deadlift en een squat beginnen allebei concentrisch', 'Nee, een deadlift begint bijvoorbeeld excentrisch', 'Nee, een plank begint bijvoorbeeld concentrisch'], 'de eerste fase van een oefening is niet altijd concentrisch.'],
  ['sagittaal-deling', 'Welke delen onderscheidt het sagittale vlak?', 'Links en rechts', ['Voor en achter', 'Boven en onder', 'Proximaal en distaal'], 'Deelt links/rechts. As: transversaal.'],
  ['sagittaal-as', 'Welke as hoort bij het sagittale vlak?', 'De transversale as', ['De sagittale as', 'De longitudinale as', 'De diagonale as'], 'Deelt links/rechts. As: transversaal.'],
  ['sagittaal-voorbeelden', 'Welke combinatie valt in het sagittale vlak?', 'Een lunge voor-achter en het been voorwaarts heffen', ['Een woodchop en romprotatie', 'Arm en been zijwaarts heffen', 'Een zijwaartse lunge en lateroflexie'], 'Vb: lunge voor-achter, been'],
  ['frontaal-deling', 'Welke delen onderscheidt het frontale vlak?', 'Voor en achter', ['Links en rechts', 'Boven en onder', 'Proximaal en distaal'], 'Deelt voor/achter. As: sagittaal.'],
  ['frontaal-as', 'Welke as hoort bij het frontale vlak?', 'De sagittale as', ['De transversale as', 'De longitudinale as', 'De diagonale as'], 'Deelt voor/achter. As: sagittaal.'],
  ['frontaal-been', 'In welk vlak valt het zijwaarts heffen van een been?', 'Het frontale vlak', ['Het sagittale vlak', 'Het transversale vlak', 'Het diagonale vlak'], 'zijwaarts heffen van arm of been.'],
  ['transversaal-deling', 'Welke delen onderscheidt het transversale vlak?', 'Boven en onder', ['Voor en achter', 'Links en rechts', 'Mediaal en lateraal'], 'Deelt boven/onder. As: longitudinaal.'],
  ['transversaal-voorbeelden', 'Welke bewegingen vallen in het transversale vlak?', 'Woodchop en romprotatie', ['Lunge voor-achter en been voorwaarts heffen', 'Arm en been zijwaarts heffen', 'Biceps curl en leg extension'], 'Vb: woodchop, romprotatie.'],
  ['keten-definitie', 'Wat is een kinetische keten?', 'Gewrichten en spieren die samenwerken voor één beweging', ['Een rij spieren die in één sessie na elkaar worden getraind', 'Een reeks oefeningen met dezelfde weerstandscurve', 'Gewrichten die vastzitten tijdens een beweging'], 'Een kinetische keten is een reeks gewrichten en spieren'],
  ['keten-squat', 'Welke gewrichten vormen de kinetische keten bij een squat?', 'Enkel, knie en heup', ['Pols, knie en heup', 'Enkel, heup en schouder', 'Knie, heup en onderrug'], 'enkel–knie–heup bij een squat'],
  ['keten-energie', 'Hoe stroomt de energie bij een golfswing?', 'Van voeten via heup en romp naar handen', ['Van handen via romp en heup naar voeten', 'Van romp via heup en handen naar voeten', 'Van voeten via romp en handen naar heup'], 'van voeten via heup en romp naar'],
  ['energielek-definitie', 'Wat is een energielek in een kinetische keten?', 'Verlies van energie of kracht, meestal door een technische fout', ['Verlies van spiermassa, meestal door te weinig herstel', 'Verlies van balans, meestal door een te smalle standbreedte', 'Toename van de belasting op een gewricht, meestal door een lange momentarm'], 'Een energielek = verlies van energie/kracht'],
  ['open-segmenten', 'Welke segmenten zijn vast en vrij in een open keten?', 'Proximaal vast, distaal vrij', ['Proximaal vrij, distaal vast', 'Superieur vast, inferieur vrij', 'Anterieur vast, posterieur vrij'], 'Proximaal segment vast, distaal segment vrij'],
  ['open-kenmerken', 'Wat kenmerkt een open-ketenoefening?', 'Gewrichtsspecifiek, één segment beweegt, stabiliteit minder belangrijk', ['Meerdere gewrichten bewegen, stabiliteit cruciaal', 'Gewrichtsspecifiek, één segment beweegt, stabiliteit cruciaal', 'Compound, meerdere segmenten bewegen, stabiliteit minder belangrijk'], 'Gewrichtsspecifiek, stabiliteit minder belangrijk'],
  ['open-isolatie', 'Welke combinatie hoort bij een open keten?', 'Isolatie-oefening in een enkel bewegingsvlak', ['Compound-oefening in meerdere vlakken', 'Isolatie-oefening in meerdere bewegingsvlakken', 'Compound-oefening in een enkel bewegingsvlak'], 'Isolatie-oefening, enkel bewegingsvlak'],
  ['gesloten-beweging', 'Hoe bewegen segmenten in een gesloten keten?', 'Meerdere segmenten gelijktijdig in een voorspelbaar patroon', ['Eén vrij distaal segment in een los patroon', 'Meerdere segmenten na elkaar in een willekeurig patroon', 'Eén proximaal segment in een voorspelbaar patroon'], 'Meerdere segmenten bewegen gelijktijdig, voorspelbaar patroon'],
  ['gesloten-stabiliteit', 'Welke rol heeft stabiliteit in een gesloten keten?', 'Cruciaal bij het nabootsen van natuurlijke beweging', ['Minder belangrijk door het isolerende karakter', 'Cruciaal bij het isoleren van één gewricht', 'Minder belangrijk bij het nabootsen van natuurlijke beweging'], 'Bootst natuurlijke beweging na, stabiliteit cruciaal'],
  ['gesloten-voorbeeld', 'Welke combinatie hoort bij een gesloten keten?', 'Squat: compound, co-contractie en meerdere vlakken', ['Leg extension: isolatie en één bewegingsvlak', 'Curl: compound, co-contractie en meerdere vlakken', 'Lunge: isolatie en één vrij bewegend distaal segment'], 'Compound, co-contractie, meerdere vlakken (bv. squat)'],
  ['anterior-chain', 'Welke spieren vormen de anterior chain?', 'Pectoralis, heupflexoren, buikspieren en quadriceps', ['Kuiten, hamstrings, gluteus, latissimus en erector spinae', 'Pectoralis, heupflexoren, buikspieren en hamstrings', 'Latissimus, heupflexoren, gluteus en quadriceps'], 'Anterior chain: pectoralis, heupflexoren, buikspieren, quadriceps.'],
  ['posterior-chain', 'Welke spieren vormen de posterior chain?', 'Kuiten, hamstrings, gluteus, latissimus en erector spinae', ['Pectoralis, heupflexoren, buikspieren en quadriceps', 'Kuiten, hamstrings, gluteus, pectoralis en rectus abdominis', 'Kuiten, quadriceps, gluteus, latissimus en buikspieren'], 'Posterior chain: kuiten, hamstrings,'],
  ['momentarm-definitie', 'Wat is de momentarm?', 'Afstand tussen het aangrijpingspunt van de kracht en het draaipunt', ['Afstand tussen het aangrijpingspunt van de kracht en de last', 'Afstand tussen het draaipunt en het zwaartepunt van het lichaam', 'Lengte van het botsegment tussen twee gewrichten'], 'de afstand tussen het aangrijpingspunt van de kracht'],
  ['momentarm-compensatie', 'Wat vraagt een langere momentarm bij dezelfde kracht van de spieren?', 'Meer spierkracht om te compenseren', ['Minder spierkracht om te compenseren', 'Dezelfde spierkracht om te compenseren', 'Meer spierlengte om te compenseren'], 'hoe meer spierkracht er nodig is om te compenseren.'],
  ['primaire-hefboom', 'Hoe liggen de onderdelen bij een primaire hefboom?', 'Het fulcrum ligt tussen inspanning en last', ['De last ligt tussen fulcrum en inspanning', 'De inspanning ligt tussen fulcrum en last', 'Fulcrum en last zijn hetzelfde punt'], 'Fulcrum tussen inspanning en last.'],
  ['primaire-voorbeeld', 'Wat is een voorbeeld van een primaire hefboom?', 'Een wip', ['Een kruiwagen', 'De elleboog bij een curl', 'Een notenkraker'], 'wip. Gelijke afstand = gelijke kracht'],
  ['primaire-afstand', 'Wat geldt bij gelijke afstanden tussen draaipunt, inspanning en last op een wip?', 'Er is gelijke kracht nodig', ['Er is tweemaal zoveel kracht nodig', 'Er is half zoveel kracht nodig', 'Er is meer kracht nodig dan de last weegt'], 'Gelijke afstand = gelijke kracht'],
  ['secundaire-hefboom', 'Hoe liggen de onderdelen bij een secundaire hefboom?', 'De last ligt tussen fulcrum en inspanning', ['Het fulcrum ligt tussen inspanning en last', 'De inspanning ligt tussen fulcrum en last', 'Inspanning en fulcrum vallen samen'], 'Last tussen fulcrum en inspanning.'],
  ['secundaire-voorbeeld', 'Wat is een voorbeeld van een secundaire hefboom?', 'Een kruiwagen', ['Een wip', 'De elleboog bij een curl', 'Een schaar'], 'kruiwagen. Last dicht bij fulcrum'],
  ['secundaire-last', 'Wat gebeurt er als de last in een kruiwagen dichter bij het fulcrum zit?', 'Je kunt meer tillen', ['Je kunt minder tillen', 'Je kunt evenveel tillen', 'De hefboom wordt primair'], 'kruiwagen. Last dicht bij fulcrum =\nmeer te tillen.'],
  ['tertiaire-hefboom', 'Hoe liggen de onderdelen bij een tertiaire hefboom?', 'De inspanning ligt tussen fulcrum en last', ['De last ligt tussen fulcrum en inspanning', 'Het fulcrum ligt tussen inspanning en last', 'Last en fulcrum zijn hetzelfde punt'], 'Inspanning tussen fulcrum en last'],
  ['tertiaire-voorbeeld', 'Welke lichaamshefboom is tertiair?', 'De elleboog bij een curl', ['De wip', 'De kruiwagen', 'De notenkraker'], '(bv. elleboog bij curl).'],
  ['tertiaire-eigenschappen', 'Welke afweging hoort bij tertiaire hefbomen?', 'Ze kosten veel kracht en geven snelheid en bereik', ['Ze kosten weinig kracht en geven weinig snelheid en bereik', 'Ze kosten weinig kracht en geven snelheid en bereik', 'Ze kosten veel kracht en geven stabiliteit en meer tilvermogen'], 'Kost veel kracht,'],
  ['lowbar-heup', 'Welk gewricht wordt het meest belast door de lange momentarm bij een low bar back squat?', 'De heup', ['De knie', 'De enkel', 'De schouder'], 'bij de low bar back squat is de moment arm op de heup het langst'],
  ['frontsquat-knie', 'Welk gewricht wordt het meest belast door de lange momentarm bij een front squat?', 'De knie', ['De heup', 'De enkel', 'De onderrug'], 'Bij de front squat is de moment arm op de knie het langst'],
  ['goodmorning', 'Waar ontstaan grote momentarmen bij een good morning?', 'Bij de heup en de onderrug', ['Bij de knie en de enkel', 'Bij de heup en de knie', 'Bij de schouder en de onderrug'], 'de good morning is de moment arm op zowel heup als onderrug groot'],
  ['curve-definitie', 'Wat beschrijft een weerstandscurve?', 'Hoe de weerstand verandert tijdens de beweging', ['Hoe de spierlengte verandert tijdens de beweging', 'Hoe de beweegsnelheid verandert tijdens de set', 'Hoe de belasting verandert tussen twee trainingsweken'], 'De weerstandscurve beschrijft hoe de weerstand verandert tijdens de beweging.'],
  ['curve-direct', 'Wanneer is de weerstand hoog ten opzichte van de bewegingsrichting?', 'Wanneer je direct tegen de weerstand in beweegt', ['Wanneer je met de weerstand mee beweegt', 'Wanneer je zijwaarts langs de weerstand beweegt', 'Wanneer de weerstand dicht bij het draaipunt aangrijpt'], 'waar je direct tegen de weerstand in beweegt'],
  ['curve-afstand', 'Waar ligt het gewicht ten opzichte van het fulcrum bij de hoogste weerstand?', 'Het gewicht is het verst van het fulcrum', ['Het gewicht is het dichtst bij het fulcrum', 'Het gewicht ligt recht boven het fulcrum', 'Het gewicht is gelijk verdeeld rond het fulcrum'], 'waar het gewicht het verst van het fulcrum is'],
  ['curve-kabel', 'Welke segmentpositie geeft hoge weerstand bij een kabel?', 'Haaks op de kabel', ['Parallel aan de kabel', 'Parallel aan de grond', 'Verticaal onder het fulcrum'], 'het segment haaks op de kabel staat'],
  ['curve-vrijgewicht', 'Welke segmentpositie geeft hoge weerstand bij een vrij gewicht?', 'Parallel aan de grond', ['Haaks op de grond', 'Haaks op de kabel', 'Parallel aan de kabel'], 'parallel aan de grond is (vrij gewicht).'],
  ['oplopende-curve', 'Hoe verloopt een oplopende weerstandscurve?', 'Weerstand groeit naar het eind, vaak met de verkorte positie als zwaarste', ['Weerstand daalt naar het eind, vaak met de verlengde positie als zwaarste', 'Weerstand piekt in het midden en daalt aan beide kanten', 'Weerstand groeit naar het eind, vaak met de verlengde positie als zwaarste'], 'Weerstand groeit richting het eind'],
  ['oplopend-voorbeelden', 'Welke voorbeelden horen bij een oplopende curve?', 'Cable fly en leg extension', ['DB flat press en overhead extension', 'Staande lateral raise en dumbbell curl', 'Cable fly en dumbbell curl'], 'cable fly, leg extension'],
  ['aflopende-curve', 'Hoe verloopt een aflopende weerstandscurve?', 'Weerstand daalt naar het eind, vaak met de verlengde positie als zwaarste', ['Weerstand groeit naar het eind, vaak met de verkorte positie als zwaarste', 'Weerstand piekt in het midden en daalt aan beide kanten', 'Weerstand daalt naar het eind, vaak met de verkorte positie als zwaarste'], 'Weerstand neemt af richting het eind'],
  ['aflopend-voorbeelden', 'Welke voorbeelden horen bij een aflopende curve?', 'DB flat press en overhead extension', ['Cable fly en leg extension', 'Staande lateral raise en dumbbell curl', 'DB flat press en leg extension'], 'db flat press, overhead extension'],
  ['bell-voorbeelden', 'Welke voorbeelden horen bij een bell-shaped curve?', 'Staande lateral raise en dumbbell curl', ['Cable fly en leg extension', 'DB flat press en overhead extension', 'Staande lateral raise en leg extension'], 'staande\nlat raise, curl met db'],
  ['curve-combinatie', 'Welke weerstandscurves combineer je om de volledige spierlengte te belasten?', 'Oplopend en aflopend, eventueel aangevuld met bell-shaped', ['Drie oefeningen met dezelfde oplopende curve', 'Bell-shaped en isometrisch, zonder aflopende varianten', 'Aflopend en isometrisch, eventueel aangevuld met oplopend'], 'Combineer daarom bewust een oplopende + aflopende'],
  ['verlengde-positie', 'Wat betekent de verlengde spierpositie?', 'De spier is maximaal op rek', ['De spier is maximaal verkort', 'De spier is noch maximaal verlengd noch verkort', 'De spier heeft al zijn functies uitgevoerd'], 'Verlengde positie — spier maximaal op rek.'],
  ['passieve-insufficientie', 'Wat is passieve insufficiëntie?', 'Een bi- of tri-articulaire spier kan moeilijk over meerdere gewrichten tegelijk verlengen', ['Een bi- of tri-articulaire spier kan moeilijk over meerdere gewrichten tegelijk verkorten', 'Een mono-articulaire spier kan moeilijk over één gewricht verlengen', 'Een bi- of tri-articulaire spier kan moeilijk over één gewricht verlengen'], 'spier heeft moeite om over meerdere gewrichten tegelijk te verlengen.'],
  ['middenpositie', 'Wat is de middenpositie van een spier?', 'Niet maximaal verlengd of verkort; vaak de sterkste, meest neutrale positie', ['Maximaal verlengd; vaak de zwakste, meest rekbare positie', 'Maximaal verkort; vaak de zwakste, meest samengetrokken positie', 'Niet maximaal verlengd of verkort; vaak de zwakste, meest instabiele positie'], 'Middenpositie — niet maximaal verlengd of verkort.'],
  ['verkorte-positie', 'Wat is de verkorte spierpositie?', 'De spier is maximaal verkort en heeft al zijn functies uitgevoerd', ['De spier staat maximaal op rek en voert alle functies uit', 'De spier is niet maximaal verlengd of verkort', 'De spier is maximaal verkort en heeft nog functies te vervullen'], 'Verkorte positie — spier vervult alle functies.'],
  ['actieve-voorbeeld', 'Wat is een voorbeeld van actieve insufficiëntie van de hamstrings?', 'Knie buigen met een gestrekte heup', ['Knie strekken met een gebogen heup', 'Knie buigen met een gebogen heup', 'Heup strekken met een gestrekte knie'], 'hamstrings knie buigen mét\ngestrekte heup'],
  ['rom-onderlichaam', 'Welke ROM heeft voor het onderlichaam vrijwel altijd de voorkeur?', 'Full ROM boven partial ROM', ['Partial ROM boven full ROM', 'Partial ROM in de verkorte positie', 'Even veel full als partial ROM'], 'Full ROM werkt voor het onderlichaam vrijwel altijd beter dan partial ROM.'],
  ['motor-resultaat', 'Hoe hangen spiercontractie en gewrichtsbeweging samen?', 'De spier is de motor en de gewrichtsbeweging het resultaat', ['De gewrichtsbeweging is de motor en de spiercontractie het resultaat', 'De spier is de motor en de pees het resultaat', 'De spiercontractie en de gewrichtsbeweging staan los van elkaar'], 'De spier is de motor, de'],
  ['tertiaire-meerderheid', 'Welk type hefboom komt bij de meeste gewrichten voor?', 'Tertiair', ['Primair', 'Secundair', 'Gemengd'], 'de meeste gewrichten in het lichaam'],
  ['goodmorning-chain', 'Welke keten wordt zwaar belast bij de good morning?', 'De posterior chain', ['De anterior chain', 'De schouderketen', 'De armketen'], 'zware belasting posterior\nchain.'],
  ['bell-uiteinden', 'Hoe verhouden begin en eind zich tot het midden bij een bell-shaped curve?', 'Begin en eind zijn lichter dan het midden', ['Begin en eind zijn zwaarder dan het midden', 'Het begin is zwaarder dan het midden en het eind', 'Het eind is zwaarder dan het begin en het midden'], 'begin en eind zijn lichter'],
  ['range-dekking', 'Dekken drie losse oefeningen vanzelf de hele range?', 'Nee, dat gebeurt zelden; combineer bewust verschillende curves', ['Ja, drie oefeningen dekken doorgaans de hele range', 'Ja, zolang je drie verschillende spieren traint', 'Nee, dat gebeurt zelden; kies drie keer dezelfde curve'], '3 losse oefeningen dekken zelden de héle range.'],
  ['rom-bovenlichaam', 'Hoe gebruik je full en partial ROM voor het bovenlichaam?', 'Beide werken; daag de spier ook in de verlengde positie uit', ['Full ROM werkt beter; partial ROM is overbodig', 'Beide werken; daag de spier vooral in de verkorte positie uit', 'Partial ROM werkt beter; vermijd belasting in de verlengde positie'], 'Voor het bovenlichaam\nwerken beide']
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
