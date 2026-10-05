// Group existing sequential lessons without changing their IDs or progress.
export function lessonGroups(levels) {
  if (!levels.length) return [];
  const count = Math.max(levels.length >= 4 ? 2 : 1, Math.round(levels.length / 4));
  const size = Math.floor(levels.length / count);
  const extra = levels.length % count;
  return Array.from({ length: count }, (_, index) => {
    const start = index * size + Math.min(index, extra);
    const lessons = levels.slice(start, start + size + Number(index < extra));
    const done = lessons.every(lesson => lesson.done);
    const next = lessons.find(lesson => !lesson.done);
    const locked = !done && next.locked;
    const type = index === 0 ? 'learn' : index === count - 1 ? 'finish' : 'practice';
    const label = { learn: 'Leren', practice: 'Oefenen', finish: 'Afronden' }[type];
    const icon = { learn: 'star', practice: 'barbell', finish: 'trophy' }[type];
    return {
      id: lessons[0].id, index, type, label, icon, lessons, done, locked,
      completed: lessons.filter(lesson => lesson.done).length,
      next: done ? lessons[0] : next,
    };
  });
}
