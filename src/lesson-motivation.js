// Session-local encouragement describes attempts, never mastery or bonus XP.
export function lessonMomentum(session) {
  const history = Array.isArray(session?.answerHistory) ? session.answerHistory : [];
  return history.reduce(({ run, bestRun }, attempt) => {
    const nextRun = attempt?.correct === true && attempt.skipped !== true ? run + 1 : 0;
    return { run: nextRun, bestRun: Math.max(bestRun, nextRun) };
  }, { run: 0, bestRun: 0 });
}

export function lessonInterlude(session) {
  if (!session || session.finished || !Array.isArray(session.ids) ||
    !Number.isInteger(session.index) || !Number.isInteger(session.initialCount) ||
    session.initialCount < 1 || session.initialCount > session.ids.length ||
    session.index < 1 || session.index >= session.ids.length) return null;

  const dismissed = new Set(Array.isArray(session.dismissedInterludes) ? session.dismissedInterludes : []);
  const shownCount = Number(dismissed.has('halfway')) + Number(dismissed.has('retry'));
  if (shownCount >= 2) return null;

  if (session.initialCount >= 6 && session.index === Math.floor(session.initialCount / 2) && !dismissed.has('halfway')) {
    const { run } = lessonMomentum(session);
    return {
      key: 'halfway', kind: 'halfway',
      title: 'Halverwege',
      description: session.index + '/' + session.initialCount + ' vragen · nog ' + (session.initialCount - session.index),
      icon: run >= 3 ? 'sparkles' : 'target'
    };
  }

  if (session.index === session.initialCount && session.ids.length > session.initialCount && !dismissed.has('retry')) {
    const remaining = session.ids.length - session.initialCount;
    return {
      key: 'retry', kind: 'retry', title: 'Herkansing',
      description: remaining + (remaining === 1 ? ' vraag' : ' vragen'),
      icon: 'refresh'
    };
  }
  return null;
}
