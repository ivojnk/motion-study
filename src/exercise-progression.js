import { supportsOpenAnswer, needsMistakeReview } from './learning.js';

// Deep muscles are deliberately excluded: pointing must be possible without
// highlighting the correct answer through an overlying structure.
const pointableMuscles = new Set([
  'pectoralis', 'delt-front', 'delt-mid', 'delt-back', 'lats', 'traps-upper',
  'biceps', 'triceps', 'rectus-abd', 'glute-max', 'rectus-fem', 'gastrocnemius'
]);

export function availableExercises(question) {
  if (question.type === 'recognition') {
    return pointableMuscles.has(question.muscleId)
      ? ['recognition', 'point', 'recognition-open']
      : ['recognition', 'recognition-open'];
  }
  return ['choice', 'binary', supportsOpenAnswer(question) ? 'open' : 'open-self'];
}

function spacedSuccess(stats, mode) {
  return Number.isInteger(stats?.[mode]?.spacedCorrect) && stats[mode].spacedCorrect > 0;
}

export function exerciseForProgress(question, questionProgress, { index = 0, now = Date.now() } = {}) {
  const modes = availableExercises(question);
  const turn = Number.isInteger(index) ? Math.abs(index) : 0;
  const recognition = question.type === 'recognition';
  const easy = recognition ? 'recognition' : turn % 3 === 1 ? 'binary' : 'choice';
  if (needsMistakeReview(questionProgress)) {
    if (!questionProgress?.lastCorrect) return easy;
    if (questionProgress.mistakeReview?.successes >= 1) {
      return recognition && modes.includes('point') && questionProgress.mistakeReview.successes === 1 ? 'point' : modes.at(-1);
    }
  }
  if (!questionProgress?.lastCorrect || !(questionProgress.interval >= 1)) return easy;

  // An interval describes completed spaced practice. The NEXT harder form is
  // introduced when due; replaying a lesson early stays at the completed stage.
  let stage = Math.floor(Math.log2(questionProgress.interval)) + 1;
  if (questionProgress.due > now) stage--;
  if (stage <= 0) return easy;

  const middle = recognition ? modes.includes('point') ? 'point' : 'recognition-open' : modes[2];
  const recall = recognition ? 'recognition-open' : modes[2];
  const stats = questionProgress.exerciseStats;
  if (stats && Object.keys(stats).length) {
    // Interleaved assisted repeats cannot substitute for practising a harder
    // modality, even if their global repetition interval keeps increasing.
    if (!spacedSuccess(stats, middle)) stage = Math.min(stage, 1);
    else if (!spacedSuccess(stats, recall)) stage = Math.min(stage, 2);
  }
  if (stage === 1) return middle;
  if (stage === 2) return recall;

  // Once recall has been practised, keep the same fact alive in varied forms.
  // Half of mature repetitions still ask for unassisted recall.
  return [recall, middle, recall, easy][turn % 4];
}
