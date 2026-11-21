// Picks a small pool of wrong options that look like the answer. The app shows
// three of them at random, so every option in the pool has to be plausible.
const STOP = new Set(['met', 'van', 'het', 'een', 'and', 'the', 'bij', 'tot', 'naar', 'voor', 'zonder', 'ook']);
const tokens = text => new Set(String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(word => word.length > 2 && !STOP.has(word)));

export function similarity(a, b) {
  const left = tokens(a), right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared++;
  return shared / (left.size + right.size - shared);
}

const ZONES = { borst: 'upper', rug: 'upper', armen: 'upper', core: 'trunk', heup: 'lower', quads: 'lower', hamstrings: 'lower', kuiten: 'lower' };
export const zoneOf = region => ZONES[region] || region;

// Same region first, then the same part of the body, then the rest.
export function regionTiers(region, items) {
  const same = items.filter(item => item.region === region);
  const zone = items.filter(item => item.region !== region && zoneOf(item.region) === zoneOf(region));
  const rest = items.filter(item => !same.includes(item) && !zone.includes(item));
  return [same, zone, rest].map(tier => tier.map(item => item.value));
}

// Same opening word plus a "label: ..." layout reads as one template.
const shape = text => String(text).toLowerCase().split(/[\s:;]/)[0] + (/[:;]/.test(text) ? ':' : '');
const defaultAlike = (a, b) => similarity(a, b) >= 0.6 || (/[:;]/.test(a) && shape(a) === shape(b));

// tiers: arrays of candidate strings, most relevant first.
// ambiguous: drop candidates so close to the answer that they could also be right.
// alike: two distractors that look alike are only both kept when the answer
// looks like them too, so the answer is never the odd one out.
export function pickDistractors(answer, tiers, { limit = 5, ambiguous = 0.6, alike = defaultAlike } = {}) {
  const chosen = [];
  const length = String(answer).length;
  const accept = (candidate, strict) => {
    if (!candidate || candidate === answer || chosen.includes(candidate)) return false;
    if (similarity(candidate, answer) >= ambiguous) return false;
    // A piece of the answer ("Bovenkant femur" inside "IT-band · bovenkant femur") is half true.
    if (ambiguous <= 1 && [...tokens(candidate)].every(word => tokens(answer).has(word))) return false;
    return !strict || !chosen.some(other => alike(candidate, other) && !alike(candidate, answer));
  };
  for (const strict of [true, false]) {
    for (const [tierIndex, tier] of tiers.entries()) {
      // The last tier (other body areas) only tops up to three options.
      const cap = tiers.length > 1 && tierIndex === tiers.length - 1 ? 3 : limit;
      const ranked = [...new Set(tier)].map((value, index) => ({ value, index }))
        .sort((a, b) => Math.abs(a.value.length - length) - Math.abs(b.value.length - length) || a.index - b.index);
      for (const { value } of ranked) {
        if (chosen.length >= cap || (!strict && chosen.length >= 3)) break;
        if (accept(value, strict)) chosen.push(value);
      }
    }
    if (chosen.length >= 3) break;
  }
  if (chosen.length < 3) throw new Error('Not enough distinct distractors for: ' + answer);
  return chosen;
}
