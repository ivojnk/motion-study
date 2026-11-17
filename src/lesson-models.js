const muscleChapters = new Set(['borst', 'rug', 'armen', 'core', 'heup', 'quads', 'hamstrings', 'kuiten']);

// Keep the saved lesson partitions intact. An early recognition question is
// extra practice of an existing fact, with the same question and progress ID.
export function withLessonModels(originals, questions) {
  const region = originals[0]?.region;
  if (!muscleChapters.has(region) || originals.some(question =>
    question.type === 'recognition' || question.type === 'exercise-recognition')) return originals;

  const muscleIds = [...new Set(originals.flatMap(question => [
    ...(question.muscleId ? [question.muscleId] : []),
    ...(question.modelContext?.muscleIds || [])
  ]))];
  for (const muscleId of muscleIds) {
    const recognition = questions.find(question => question.type === 'recognition' &&
      question.region === region && question.muscleId === muscleId &&
      !originals.some(original => original.id === question.id));
    if (recognition) return [recognition, ...originals];
  }
  return originals;
}
