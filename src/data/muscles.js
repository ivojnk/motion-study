// Each anchor points to the supplied cheatsheet. Mesh patterns use Z-Anatomy names.
export const muscles = [
  ['pectoralis', 'Pectoralis major', 'borst', 'Pectoralis major\nOORSPRONG', 'Deltoideus — voorste kop', ['pectoralis major'], 'front'],
  ['delt-front', 'Deltoideus · voorste kop', 'borst', 'Deltoideus — voorste kop\nOORSPRONG', 'Deltoideus — middelste kop', ['Clavicular part of deltoid'], 'front'],
  ['delt-mid', 'Deltoideus · middelste kop', 'borst', 'Deltoideus — middelste kop\nOORSPRONG', 'Deltoideus — achterste kop', ['Acromial part of deltoid'], 'front'],
  ['delt-back', 'Deltoideus · achterste kop', 'borst', 'Deltoideus — achterste kop\nOORSPRONG', 'Rotator cuff (4)', ['Scapular spinal part of deltoid'], 'back'],
  ['serratus', 'Serratus anterior', 'borst', 'Serratus anterior\nFUNCTIE', 'Pectoralis minor\nFUNCTIE', ['Serratus anterior muscle'], 'side'],
  ['pec-minor', 'Pectoralis minor', 'borst', 'Pectoralis minor\nFUNCTIE', 'Lengteprofiel-balk', ['Pectoralis minor muscle'], 'front'],
  ['lats', 'Latissimus dorsi', 'rug', 'Latissimus dorsi\nOORSPRONG', 'Trapezius — boven', ['Latissimus dorsi muscle'], 'back'],
  ['traps-upper', 'Trapezius · boven', 'rug', 'Trapezius — boven (descendens)\nOORSPRONG', 'Trapezius — midden', ['Descending part of trapezius'], 'back'],
  ['traps-mid', 'Trapezius · midden', 'rug', 'Trapezius — midden (transversa)\nOORSPRONG', 'Trapezius — onder', ['Transverse part of trapezius'], 'back'],
  ['traps-lower', 'Trapezius · onder', 'rug', 'Trapezius — onder (ascendens)\nOORSPRONG', 'Rhomboideus (minor/major)', ['Ascending part of trapezius'], 'back'],
  ['rhomboids', 'Rhomboideus', 'rug', 'Rhomboideus (minor/major)\nFUNCTIE', 'OEFENING SPIER(GEDEELTE)', ['Rhomboid major muscle', 'Rhomboid minor muscle'], 'back'],
  ['biceps', 'Biceps brachii', 'armen', 'Biceps brachii\nOORSPRONG', 'Brachialis\nFUNCTIE', ['biceps brachii'], 'front'],
  ['brachialis', 'Brachialis', 'armen', 'Brachialis\nFUNCTIE', 'Triceps brachii\nOORSPRONG', ['Brachialis muscle'], 'front'],
  ['triceps', 'Triceps brachii', 'armen', 'Triceps brachii\nOORSPRONG', 'OEFENING SPIER BEWEGING', ['triceps brachii'], 'back'],
  ['rectus-abd', 'Rectus abdominis', 'core', 'Rectus abdominis\nOORSPRONG', 'Externe obliques\nOORSPRONG', ['Rectus abdominis muscle'], 'front'],
  ['oblique-ext', 'Externe obliques', 'core', 'Externe obliques\nOORSPRONG', 'Interne obliques\nOORSPRONG', ['External abdominal oblique'], 'front'],
  ['oblique-int', 'Interne obliques', 'core', 'Interne obliques\nOORSPRONG', 'Transversus abdominis\nFUNCTIE', ['Internal abdominal oblique'], 'front'],
  ['transversus', 'Transversus abdominis', 'core', 'Transversus abdominis\nFUNCTIE', 'Middenrif / diafragma', ['Transversus abdominis muscle'], 'front'],
  ['ql', 'Quadratus lumborum', 'core', 'Quadratus lumborum\nOORSPRONG', 'Erector spinae\nOORSPRONG', ['Quadratus lumborum muscle'], 'back'],
  ['erector', 'Erector spinae', 'core', 'Erector spinae\nOORSPRONG', 'Iliopsoas\nFUNCTIE', ['Iliocostalis', 'Longissimus', 'Spinalis'], 'back'],
  ['iliopsoas', 'Iliopsoas', 'core', 'Iliopsoas\nFUNCTIE', 'ANTI-CORE', ['Psoas major muscle', 'Iliacus muscle'], 'front'],
  ['glute-max', 'Gluteus maximus', 'heup', 'Gluteus maximus\nOORSPRONG', 'Gluteus medius & minimus\nOORSPRONG', ['Gluteus maximus muscle'], 'back'],
  ['glute-med', 'Gluteus medius & minimus', 'heup', 'Gluteus medius & minimus\nOORSPRONG', 'Tensor fasciae latae\nFUNCTIE', ['Gluteus medius muscle', 'Gluteus minimus muscle'], 'back'],
  ['tfl', 'Tensor fasciae latae', 'heup', 'Tensor fasciae latae\nFUNCTIE', 'Adductoren (longus', ['Tensor fasciae latae'], 'front'],
  ['adductors', 'Adductoren', 'heup', 'Adductoren (longus/brevis/magnus,', 'OEFENING SPIER BEWEGING', ['Adductor longus muscle', 'Adductor brevis muscle', 'Adductor magnus muscle', 'Gracilis muscle', 'Pectineus muscle'], 'front'],
  ['rectus-fem', 'Rectus femoris', 'quads', 'Rectus femoris\nOORSPRONG', 'Vastus medialis / lateralis / intermedius', ['Rectus femoris muscle'], 'front'],
  ['vasti', 'Vastus medialis / lateralis / intermedius', 'quads', 'Vastus medialis / lateralis / intermedius\nOORSPRONG', 'OEFENING SPIER BEWEGING', ['Vastus medialis muscle', 'Vastus lateralis muscle', 'Vastus intermedius muscle'], 'front'],
  ['biceps-fem', 'Biceps femoris', 'hamstrings', 'Biceps femoris\nOORSPRONG', 'Semimembranosus / semitendinosus', ['biceps femoris'], 'back'],
  ['semis', 'Semimembranosus / semitendinosus', 'hamstrings', 'Semimembranosus / semitendinosus\nOORSPRONG', 'OEFENING SPIER BEWEGING', ['Semimembranosus muscle', 'Semitendinosus muscle'], 'back'],
  ['soleus', 'Soleus', 'kuiten', 'Soleus\nOORSPRONG', 'Gastrocnemius (med./lat.)', ['Soleus muscle'], 'back'],
  ['gastrocnemius', 'Gastrocnemius', 'kuiten', 'Gastrocnemius (med./lat.)\nOORSPRONG', 'OEFENING SPIER BEWEGING', ['gastrocnemius'], 'back']
].map(([id, name, region, anchor, end, patterns, view]) => ({ id, name, region, anchor, end, patterns, view }));

// Additional structures explicitly named in the cheatsheet, already present in
// the licensed atlas. Keep private importer anchors on the original 31 only.
export const extraMuscleGroups = [
  ['supraspinatus', 'Supraspinatus', ['Supraspinatus muscle'], 'back', 'extra-muscles-supraspinatus'],
  ['infraspinatus', 'Infraspinatus', ['Infraspinatus muscle'], 'back', 'extra-muscles-infraspinatus'],
  ['teres-minor', 'Teres minor', ['Teres minor muscle'], 'back', 'extra-muscles-teres-minor'],
  ['subscapularis', 'Subscapularis', ['Subscapularis muscle'], 'front', 'extra-muscles-subscapularis'],
  ['teres-major', 'Teres major', ['Teres major muscle'], 'back', 'extra-muscles-teres-major'],
  ['diaphragm', 'Diafragma', ['Diaphragm'], 'front', 'extra-muscles-diaphragm-inspiration'],
  ['pelvic-floor', 'Bekkenbodem', ['Coccygeus muscle', 'Iliococcygeus muscle', 'Pubococcygeus muscle'], 'front', 'extra-muscles-pelvic-floor-role'],
  ['multifidus', 'Multifidus', ['Multifidus colli', 'Multifidus lumborum', 'Multifidus thoracis'], 'back', 'extra-muscles-inner-role']
].map(([id, name, patterns, view, sourceQuestionId]) => ({ id, name, patterns, view, sourceQuestionId }));
const atlasMuscles = [...muscles, ...extraMuscleGroups];

export function muscleForMesh(name) {
  if (/\bfascia\b|bursa|tendon|retinaculum/i.test(name)) return null;
  return atlasMuscles.find(muscle => muscle.patterns.some(pattern => name.toLowerCase().includes(pattern.toLowerCase()))) || null;
}
