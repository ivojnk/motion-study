import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { muscles } from '../src/data/muscles.js';
import { concepts } from '../src/data/concepts.js';
// Optional local import; the public build uses the checked-in question bank.
const raw = (await readFile('sources/course.txt', 'utf8')).replace(/\r/g, '');
const clean = value => value.replace(/[\u0000-\u0008]/g, '').replace(/\s+/g, ' ').trim();
const labels = { 'OORSPRONG': 'oorsprong', 'AANHECHT.': 'aanhechting', 'FUNCTIE': 'functie', 'MAX. REK': 'maximale rek' };
const cards = muscles.map(muscle => {
  const start = raw.indexOf(muscle.anchor);
  if (start < 0) throw new Error('Missing course anchor: ' + muscle.anchor);
  const end = raw.indexOf(muscle.end, start + muscle.anchor.length);
  if (end < 0) throw new Error('Missing course end: ' + muscle.end);
  const excerpt = raw.slice(start, end).replace(/(?:\n)?(?:DUWSPIER|TREKSPIER|STABILISATOR|FLEXOR|EXTENSOR(?: \+ FLEXOR HEUP)?|FLEXIE(?:\/ROTATIE)?|CORSET|INNER CORE|LATEROFLEXIE|HEUPFLEXOR|ABDUCTOR|ENDOROTATOR|ADDUCTOR|EXTENSOR HEUP|PLANTAIRFLEXOR)\s*$/, '').trim();
  const fields = {};
  const matches = [...excerpt.matchAll(/OORSPRONG|AANHECHT\.|FUNCTIE|MAX\. REK/g)];
  matches.forEach((match, index) => {
    fields[labels[match[0]]] = clean(excerpt.slice(match.index + match[0].length, matches[index + 1]?.index ?? excerpt.length));
  });
  return { ...muscle, fields, source: { section: muscle.name, excerpt, start, end } };
});
const questions = cards.flatMap(card => Object.entries(card.fields).map(([field, answer]) => {
  const distractors = [...new Set(cards.filter(other => other.id !== card.id).map(other => other.fields[field]).filter(value => value && value !== answer))].slice(0, 8);
  if (distractors.length < 3) throw new Error('Not enough distinct options for ' + card.id);
  return { id: card.id + '-' + field, region: card.region, muscleId: card.id, type: 'choice', prompt: 'Wat is de ' + field + ' van ' + card.name + ' volgens de cheatsheet?', answer, distractors, source: card.source };
}));
for (const concept of concepts) {
  const start = raw.indexOf(concept.anchor);
  if (start < 0) throw new Error('Missing concept anchor: ' + concept.anchor);
  questions.push({ ...concept, type: 'choice', source: { section: concept.region, excerpt: raw.slice(start, start + Math.max(450, concept.anchor.length)), start, end: start + Math.max(450, concept.anchor.length) } });
}
// Recognition uses the same source-linked muscle cards and verified mesh names.
for (const card of cards) questions.push({ id: card.id + '-recognition', region: card.region, muscleId: card.id, type: 'recognition', prompt: 'Welke spier is paars gemarkeerd?', answer: card.name, distractors: cards.filter(other => other.id !== card.id).map(other => other.name), source: card.source });
await mkdir('src/data', { recursive: true });
for (const item of [...cards, ...questions]) { item.source = { title: 'Anatomie & Biomechanica · Milo module 6.6', section: item.source.section }; delete item.anchor; delete item.end; }
await writeFile('src/data/curriculum.json', JSON.stringify({ license: 'CC-BY-SA-4.0', title: 'Anatomie & Biomechanica', sourceUrl: 'https://drive.google.com/file/d/1cUNMc6m7fZT2LA6F1iY5G0g2Io7OstmW/view', fetchedAt: '2026-10-05', cards, questions }, null, 2));
console.log(cards.length + ' muscle cards, ' + questions.length + ' source-linked questions');
