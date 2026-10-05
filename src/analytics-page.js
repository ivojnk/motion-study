import './admin.css';

const $ = selector => document.querySelector(selector);
const number = new Intl.NumberFormat('nl-NL');
const date = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', year: 'numeric' });
const time = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit' });
let loading = false;
async function load() {
  if (loading) return;
  loading = true;
  $('#refresh').disabled = true;
  $('#status').textContent = 'Statistieken laden…';
  try {
    const response = await fetch('/api/analytics?days=' + $('#period').value, { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) { location.replace('/beheer/'); return; }
    if (!response.ok) throw new Error('load-failed');
    const data = await response.json();
    for (const [id, value] of Object.entries({ accounts: data.totals.accounts, 'active-today': data.totals.activeToday, 'active-period': data.totals.activeAccounts, lessons: data.totals.lessons, 'period-lessons': data.period.lessons, learners: data.totals.learners })) $('#' + id).textContent = number.format(value);
    $('#new-accounts').textContent = number.format(data.period.accounts) + ' nieuw in deze periode';
    $('#daily').replaceChildren(...data.daily.slice().reverse().map(row => {
      const tr = document.createElement('tr');
      for (const [index, value] of [date.format(new Date(row.day + 'T12:00:00Z')), row.accounts, row.activeAccounts, row.lessons].entries()) {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        if (index === 0) cell.scope = 'row';
        cell.textContent = index === 0 ? value : value === null ? 'n.v.t.' : number.format(value);
        tr.append(cell);
      }
      return tr;
    }));
    $('#metrics').hidden = false;
    $('#daily-section').hidden = false;
    $('#measured-from').textContent = 'Gebruik en lessen worden gemeten sinds ' + date.format(new Date(data.measuredFrom)) + ' om ' + time.format(new Date(data.measuredFrom)) + '. Eerdere dagen staan als n.v.t. Dagtotalen blijven 90 dagen beschikbaar.';
    $('#status').textContent = 'Bijgewerkt om ' + time.format(new Date(data.generatedAt)) + '.';
  } catch { $('#status').textContent = 'Laden lukt niet. Probeer opnieuw met Vernieuwen.'; }
  finally { loading = false; $('#refresh').disabled = false; }
}
$('#period').addEventListener('change', load);
$('#refresh').addEventListener('click', load);
$('#logout').addEventListener('click', async () => {
  $('#logout').disabled = true;
  try {
    const response = await fetch('/api/owner/logout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!response.ok) throw new Error('logout-failed');
    location.replace('/beheer/');
  } catch { $('#status').textContent = 'Uitloggen lukt niet. Probeer opnieuw.'; $('#logout').disabled = false; }
});
load();
