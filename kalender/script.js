// ===== FAMILIENKALENDER (Nov 2026 - Dez 2027) =====

// --- Codewort-Login (Firebase, gemeinsam mit Hub + Touren) ---
(function() {
    const lockScreen = document.getElementById('lockScreen');
    const lockInput = document.getElementById('lockInput');
    const lockError = document.getElementById('lockError');
    const lockBtn = document.getElementById('lockBtn');
    if (!lockScreen) return;

    document.body.classList.add('locked');

    function unlock() {
        lockScreen.classList.add('unlocked');
        document.body.classList.remove('locked');
        lockError.textContent = '';
    }

    if (window.crewAuthed) unlock();
    window.addEventListener('crew-authed', unlock);

    function whenSignInReady(cb) {
        if (window.fbSignIn) return cb();
        const t = setInterval(() => { if (window.fbSignIn) { clearInterval(t); cb(); } }, 50);
    }

    function tryUnlock() {
        const code = lockInput.value;
        if (!code) return;
        lockBtn.disabled = true;
        const prevLabel = lockBtn.textContent;
        lockBtn.textContent = 'Pruefe...';
        lockError.textContent = '';
        whenSignInReady(() => {
            window.fbSignIn(code)
                .catch(() => {
                    lockError.textContent = 'Falsches Codewort! Versuch es nochmal.';
                    lockInput.value = '';
                    lockInput.focus();
                    lockScreen.style.animation = 'shake 0.4s ease';
                    setTimeout(() => lockScreen.style.animation = '', 400);
                })
                .finally(() => { lockBtn.disabled = false; lockBtn.textContent = prevLabel; });
        });
    }

    lockBtn.addEventListener('click', tryUnlock);
    lockInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); tryUnlock(); }
    });
})();

// =====================================================================
// DATEN - hier pflegen. Format: [von, bis|null, Text, Emoji, {t:1} = vorlaeufig]
// =====================================================================
const RANGE_START = '2026-11-01';
const RANGE_END = '2027-12-31';
const SCHOOL_KNOWN_UNTIL = '2027-08-15';   // danach: Schulkalender 2027/28 noch offen

// Schule frei (NIST, nur SEC)
const SCHOOL = [
    ['2026-11-27', null, 'Professional Learning Day', '🧑‍🏫'],
    ['2026-12-07', null, "King Rama IX's Birthday / Father's Day", '💛'],
    ['2026-12-19', '2027-01-10', 'Winterferien', '❄️'],
    ['2027-02-22', '2027-02-26', 'Februar-Ferien (22.02. Makha Bucha)', '🪷'],
    ['2027-03-19', null, 'Professional Learning Day', '🧑‍🏫'],
    ['2027-04-02', null, 'SEC Three-way Conferences – 2. Termin = frei', '🧳'],
    ['2027-04-06', null, 'Chakri Day', '🏛️'],
    ['2027-04-12', '2027-04-16', 'Songkran-Ferien', '💦'],
    ['2027-05-04', null, 'Coronation Day', '👑'],
    ['2027-05-20', null, 'Visakha Bucha', '🪷'],
    ['2027-05-21', null, 'Professional Learning Day', '🧑‍🏫'],
    ['2027-06-03', null, "Queen's Birthday", '👑'],
    ['2027-06-19', SCHOOL_KNOWN_UNTIL, 'Sommerferien', '☀️'],
    // Schuljahr 2027/28 noch nicht veroeffentlicht: offizielle Thai-Feiertage als vorlaeufig
    ['2027-10-13', null, 'King Bhumibol Memorial Day (offizieller Feiertag)', '🕯️', { t: 1 }],
    ['2027-10-25', null, 'Chulalongkorn Day, Ersatztag (offizieller Feiertag)', '🏛️', { t: 1 }],
    ['2027-12-06', null, "Father's Day, Ersatztag (offizieller Feiertag)", '💛', { t: 1 }],
    ['2027-12-10', null, 'Constitution Day (offizieller Feiertag)', '📜', { t: 1 }],
    ['2027-12-31', null, 'Silvester (offizieller Feiertag)', '🎆', { t: 1 }]
];

// Schul-Hinweise (Schule hat trotzdem)
const SCHOOL_INFO = [
    ['2026-12-18', null, 'Letzter Schultag vor den Ferien – SEC 11:30 Schluss', '🎒'],
    ['2027-01-11', null, 'Schule geht wieder los', '🎒'],
    ['2027-03-30', null, 'SEC Three-way Conferences – Lehrergespräche (1. Termin)', '🗣️'],
    ['2027-06-18', null, 'Letzter Schultag – SEC 11:30 Schluss', '🎒'],
    ['2027-08-16', null, 'Schuljahr 2027/28 – Kalender noch nicht veröffentlicht', '❓']
];

// Werk frei (MBMTh)
const WERK = [
    ['2026-12-07', null, "Father's Day (Ersatz für 05.12.)", '💛'],
    ['2026-12-31', null, 'Silvester', '🎆'],
    ['2027-01-01', null, 'Neujahr', '🥂'],
    ['2027-01-04', null, 'verschoben von Chulalongkorn Day (25.10.)', '🏛️'],
    ['2027-02-22', null, 'Makha Bucha (Ersatztag)', '🪷'],
    ['2027-04-12', null, 'Chakri Day (verschoben vom 06.04.)', '🏛️'],
    ['2027-04-13', '2027-04-15', 'Songkran', '💦'],
    ['2027-04-16', null, "verschoben von Father's Day (06.12.)", '💛'],
    ['2027-05-03', null, 'Labour Day (Ersatztag)', '🛠️'],
    ['2027-05-04', null, 'Coronation Day', '👑'],
    ['2027-05-20', null, 'Visakha Bucha', '🪷'],
    ['2027-06-03', null, "Queen's Birthday", '👑'],
    ['2027-07-19', null, 'Asarnha Bucha (Ersatztag)', '🪷'],
    ['2027-07-28', null, "King's Birthday", '👑'],
    ['2027-08-12', null, "Queen Mother's Birthday / Mother's Day", '💐'],
    ['2027-10-13', null, 'King Bhumibol Memorial Day', '🕯️'],
    ['2027-12-10', null, 'Constitution Day', '📜'],
    ['2027-12-31', null, 'Silvester', '🎆']
];

// Deutsche Feiertage & Tage (nur Info)
const DE = [
    ['2026-11-01', null, 'Allerheiligen (NRW/BY)', '🕯️'],
    ['2026-11-11', null, 'St. Martin / Karnevalsbeginn 11:11', '🏮'],
    ['2026-12-06', null, 'Nikolaus', '🎅'],
    ['2026-12-24', null, 'Heiligabend', '🎄'],
    ['2026-12-25', null, '1. Weihnachtstag', '🎄'],
    ['2026-12-26', null, '2. Weihnachtstag', '🎁'],
    ['2026-12-31', null, 'Silvester', '🎆'],
    ['2027-01-01', null, 'Neujahr', '🥂'],
    ['2027-01-06', null, 'Heilige Drei Könige (BY)', '👑'],
    ['2027-02-08', null, 'Rosenmontag (Bonn!)', '🎭'],
    ['2027-03-26', null, 'Karfreitag', '✝️'],
    ['2027-03-28', null, 'Ostersonntag', '🐣'],
    ['2027-03-29', null, 'Ostermontag', '🐣'],
    ['2027-05-01', null, 'Tag der Arbeit', '🌳'],
    ['2027-05-06', null, 'Christi Himmelfahrt', '☁️'],
    ['2027-05-16', null, 'Pfingstsonntag', '🕊️'],
    ['2027-05-17', null, 'Pfingstmontag', '🕊️'],
    ['2027-05-27', null, 'Fronleichnam (NRW/BY)', '⛪'],
    ['2027-10-03', null, 'Tag der Deutschen Einheit', '🇩🇪'],
    ['2027-11-01', null, 'Allerheiligen (NRW/BY)', '🕯️'],
    ['2027-11-11', null, 'St. Martin / Karnevalsbeginn 11:11', '🏮'],
    ['2027-12-06', null, 'Nikolaus', '🎅'],
    ['2027-12-24', null, 'Heiligabend', '🎄'],
    ['2027-12-25', null, '1. Weihnachtstag', '🎄'],
    ['2027-12-26', null, '2. Weihnachtstag', '🎁'],
    ['2027-12-31', null, 'Silvester', '🎆']
];

// Unsere Reisen
const TRIPS = [
    {
        id: 'winter', name: 'Winter Tour', emoji: '⛄', from: '2026-12-19', to: '2027-01-09', href: '../winter/',
        days: {
            '2026-12-19': ['✈️', 'Abflug BKK 22:10 (TK)'],
            '2026-12-20': ['🛬', 'Landung MUC 09:50 · Christkindlesmarkt Nürnberg'],
            '2026-12-21': ['🏡', 'Hepberg bei Jantzens'],
            '2026-12-22': ['🚗', 'Weiter nach Bonn zu Oma & Opa'],
            '2026-12-23': ['🤗', 'Carla stößt in Bonn dazu'],
            '2026-12-26': ['🚗', 'Bonn → Kaunertal (~700 km) · Raphaël landet INN'],
            '2026-12-27': ['⛷️', 'Erster Skitag Kaunertal'],
            '2027-01-02': ['🏔️', 'Pitztal-Tag mit Caro & Co.'],
            '2027-01-03': ['🏡', 'Weiter ins Allgäu (Leutkirch) · Carla fährt heim'],
            '2027-01-08': ['✈️', 'Rückflug MUC 19:05'],
            '2027-01-09': ['🛬', 'Landung BKK 15:10']
        }
    },
    {
        id: 'opa', name: 'Opas 80er', emoji: '🎂', from: '2027-03-17', to: '2027-03-22', href: '../opa80/',
        days: {
            '2027-03-17': ['✈️', 'TG 922 BKK 12:40 → FRA 19:05'],
            '2027-03-18': ['🤫', 'Überraschung in Bonn!'],
            '2027-03-21': ['✈️', 'TG 923 FRA 20:55'],
            '2027-03-22': ['🛬', 'Landung BKK 13:45']
        }
    }
];

// =====================================================================
// LOGIK
// =====================================================================
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WD_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

const toDate = s => new Date(s + 'T12:00:00Z');
const ymd = d => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = toDate(s); d.setUTCDate(d.getUTCDate() + n); return ymd(d); };
const dow = s => toDate(s).getUTCDay();
const isWeekend = s => dow(s) === 0 || dow(s) === 6;
const fmt = s => { const d = toDate(s); return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.'; };
const fmtLong = s => { const d = toDate(s); return WD_LONG[d.getUTCDay()] + ', ' + d.getUTCDate() + '. ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function isoWeek(s) {
    const d = toDate(s);
    const day = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - day + 3);
    const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    return 1 + Math.round(((d - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
}

// Liste -> Map Datum -> [{label, emoji, first, t}]
function expand(list) {
    const map = {};
    list.forEach(([from, to, label, emoji, opt]) => {
        let d = from;
        const end = to || from;
        while (d <= end) {
            (map[d] = map[d] || []).push({ label, emoji, first: d === from, t: !!(opt && opt.t), range: !!to });
            d = addDays(d, 1);
        }
    });
    return map;
}

const schoolMap = expand(SCHOOL);
const schoolInfoMap = expand(SCHOOL_INFO);
const werkMap = expand(WERK);
const deMap = expand(DE);

function tripOn(s) { return TRIPS.find(t => s >= t.from && s <= t.to); }

function schoolFree(s) { return isWeekend(s) || !!schoolMap[s]; }
function werkFree(s) { return isWeekend(s) || !!werkMap[s]; }
function tentative(s) { return (schoolMap[s] || []).some(e => e.t); }

// --- Fenster: zusammenhaengende schulfreie Tage (inkl. WE) mit mind. einem schulfreien Werktag ---
function computeWindows() {
    const wins = [];
    let d = addDays(RANGE_START, -3);
    let cur = null;
    const stop = addDays(RANGE_END, 3);
    while (d <= stop) {
        if (schoolFree(d)) {
            if (!cur) cur = { from: d, to: d, days: [] };
            cur.to = d; cur.days.push(d);
        } else if (cur) { wins.push(cur); cur = null; }
        d = addDays(d, 1);
    }
    if (cur) wins.push(cur);
    return wins
        .filter(w => w.days.length >= 3 && w.days.some(x => !isWeekend(x)) && w.to >= RANGE_START && w.from <= RANGE_END)
        .map(w => {
            const vac = w.days.filter(x => !werkFree(x));
            return {
                ...w,
                len: w.days.length,
                vacation: vac.length,
                tentative: w.days.some(tentative),
                openEnd: w.to === SCHOOL_KNOWN_UNTIL,
                reason: (schoolMap[w.days.find(x => schoolMap[x])] || [{}])[0],
                trip: TRIPS.find(t => t.from <= w.to && t.to >= w.from)
            };
        });
}

const WINDOWS = computeWindows();
const windowOf = {};
WINDOWS.forEach(w => w.days.forEach(x => { windowOf[x] = w; }));

// --- Anzeige-Optionen (pro Geraet gemerkt) ---
const prefs = { trips: true, de: true };
try { Object.assign(prefs, JSON.parse(localStorage.getItem('kalender_prefs') || '{}')); } catch (e) {}
function savePrefs() { try { localStorage.setItem('kalender_prefs', JSON.stringify(prefs)); } catch (e) {} }

// --- Fenster-Liste ---
function renderWindows() {
    const el = document.getElementById('winList');
    el.innerHTML = WINDOWS.map(w => {
        const allFree = w.vacation === 0;
        const r = w.reason || {};
        const range = fmt(w.from) + ' – ' + fmt(w.to) + w.to.slice(0, 4);
        return `
        <button class="win ${allFree ? 'win-all' : ''} ${w.tentative ? 'win-tent' : ''}" data-jump="${w.from}">
            <span class="win-emoji">${r.emoji || '🎉'}</span>
            <span class="win-main">
                <span class="win-date">${WD[dow(w.from)]} ${range}</span>
                <span class="win-label">${esc(r.label || '')}${w.openEnd ? ' · Ende offen' : ''}${w.tentative ? ' · vorläufig' : ''}</span>
            </span>
            <span class="win-stats">
                <strong>${w.len}${w.openEnd ? '+' : ''} Tage</strong>
                <span>${allFree ? '🎉 alle frei' : '🧳 Papa: ' + w.vacation + ' Urlaubstag' + (w.vacation === 1 ? '' : 'e')}</span>
                ${w.trip ? `<span class="win-trip">${w.trip.emoji} ${esc(w.trip.name)}</span>` : ''}
            </span>
        </button>`;
    }).join('');
    el.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => {
        const cell = document.querySelector(`[data-date="${b.dataset.jump}"]`);
        if (cell) { cell.scrollIntoView({ behavior: 'smooth', block: 'center' }); flash(cell); }
    }));
}

function flash(cell) {
    cell.classList.remove('flash'); void cell.offsetWidth; cell.classList.add('flash');
}

// --- Monate ---
function renderMonths(initial) {
    const wrap = document.getElementById('months');
    const nav = document.getElementById('monthNav');
    const today = ymd(new Date(Date.now() + 7 * 3600000)).slice(0, 10); // Bangkok-Zeit
    let html = '', navHtml = '';

    let y = +RANGE_START.slice(0, 4), m = +RANGE_START.slice(5, 7) - 1;
    const endY = +RANGE_END.slice(0, 4), endM = +RANGE_END.slice(5, 7) - 1;

    while (y < endY || (y === endY && m <= endM)) {
        const id = `m-${y}-${String(m + 1).padStart(2, '0')}`;
        const first = `${y}-${String(m + 1).padStart(2, '0')}-01`;
        const daysIn = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
        const lead = (dow(first) + 6) % 7;   // Montag = 0

        navHtml += `<a href="#${id}">${MONTHS[m].slice(0, 3)}${m === 0 || id === `m-${RANGE_START.slice(0, 7)}` ? ' ' + String(y).slice(2) : ''}</a>`;

        html += `<section class="month" id="${id}"><h2 class="month-title">${MONTHS[m]} <span>${y}</span></h2><div class="grid">`;
        html += '<div class="hd kw">KW</div>' + ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((w, i) => `<div class="hd ${i > 4 ? 'we' : ''}">${w}</div>`).join('');

        const total = Math.ceil((lead + daysIn) / 7) * 7;
        for (let i = 0; i < total; i++) {
            const dayNum = i - lead + 1;
            const s = addDays(first, i - lead);
            if (i % 7 === 0) html += `<div class="kw">${isoWeek(s)}</div>`;
            if (dayNum < 1 || dayNum > daysIn) { html += '<div class="cell empty"></div>'; continue; }
            html += renderCell(s, today);
        }
        html += '</div></section>';

        m++; if (m > 11) { m = 0; y++; }
    }
    wrap.innerHTML = html;
    nav.innerHTML = navHtml;

    wrap.querySelectorAll('.cell[data-date]').forEach(c => c.addEventListener('click', () => openSheet(c.dataset.date)));

    const cur = document.getElementById('m-' + today.slice(0, 7));
    if (initial && cur && location.hash === '') setTimeout(() => cur.scrollIntoView({ block: 'start' }), 50);
}

function renderCell(s, today) {
    const sf = !!schoolMap[s], wf = !!werkMap[s], we = isWeekend(s);
    const cls = ['cell'];
    if (we) cls.push('we');
    if (!we && sf && wf) cls.push('both');
    else if (!we && sf) cls.push('school');
    else if (!we && wf) cls.push('werk');
    if (tentative(s)) cls.push('tent');
    if (s > SCHOOL_KNOWN_UNTIL && !sf) cls.push('unknown');
    if (s === today) cls.push('today');

    // langes gemeinsames Wochenende: alle frei an >= 3 Tagen am Stueck (mit Feiertag)
    const w = windowOf[s];
    if (w && w.len <= 16 && !sharedRun[s]) cls.push('in-win');
    if (sharedRun[s]) cls.push('run');

    const emojis = [], labels = [];
    (schoolMap[s] || []).forEach(e => { if (e.first || !e.range) { emojis.push(e.emoji); labels.push(['s', e.label]); } });
    (werkMap[s] || []).forEach(e => { if (!emojis.includes(e.emoji)) emojis.push(e.emoji); if (!sf || !(schoolMap[s] || []).some(x => x.label === e.label)) labels.push(['w', e.label]); });
    (schoolInfoMap[s] || []).forEach(e => { emojis.push(e.emoji); labels.push(['i', e.label]); });
    if (prefs.de) (deMap[s] || []).forEach(e => { emojis.push(e.emoji); labels.push(['d', e.label]); });

    const trip = prefs.trips ? tripOn(s) : null;
    let tripHtml = '';
    if (trip) {
        cls.push('trip', 'trip-' + trip.id);
        const td = trip.days[s];
        if (td) { emojis.unshift(td[0]); labels.unshift(['t', td[1]]); }
        const showName = s === trip.from || dow(s) === 1 || toDate(s).getUTCDate() === 1;
        tripHtml = `<span class="trip-band">${showName ? trip.emoji + ' ' + esc(trip.name) : ''}</span>`;
    }

    let runBadge = '';
    if (sharedRun[s] && sharedRun[s].from === s) runBadge = `<span class="run-badge">🎉 ${sharedRun[s].len} Tage alle frei</span>`;
    else if (w && !sharedRun[s] && w.from === s && w.len <= 16) runBadge = `<span class="win-badge">🧳 ${w.len} Tage · ${w.vacation ? w.vacation + ' Urlaubstag' + (w.vacation === 1 ? '' : 'e') : 'alle frei'}</span>`;
    const uniq = [...new Set(emojis)].slice(0, 4);

    return `<div class="${cls.join(' ')}" data-date="${s}" tabindex="0">
        <div class="cell-top"><span class="num">${toDate(s).getUTCDate()}</span><span class="emo">${uniq.join('')}</span></div>
        ${tripHtml}${runBadge}
        <div class="lbls">${labels.filter((l, i) => labels.findIndex(x => x[1] === l[1]) === i).slice(0, 2).map(([k, t]) => `<span class="lbl lbl-${k}">${esc(t)}</span>`).join('')}</div>
    </div>`;
}

// Gemeinsam frei (Schule UND Werk) >= 3 Tage mit mind. einem Feiertag unter der Woche
const sharedRun = {};
(function() {
    let d = addDays(RANGE_START, -3), cur = [];
    const stop = addDays(RANGE_END, 3);
    const flush = () => {
        if (cur.length >= 3 && cur.some(x => !isWeekend(x))) {
            const run = { from: cur[0], to: cur[cur.length - 1], len: cur.length };
            cur.forEach(x => { sharedRun[x] = run; });
        }
        cur = [];
    };
    while (d <= stop) {
        if (schoolFree(d) && werkFree(d)) cur.push(d); else flush();
        d = addDays(d, 1);
    }
    flush();
})();

// --- Tagesdetails ---
function openSheet(s) {
    const sf = schoolFree(s), wf = werkFree(s), we = isWeekend(s);
    const row = (icon, title, txt, cls) => `<div class="srow ${cls || ''}"><span class="srow-i">${icon}</span><div><strong>${title}</strong>${txt ? '<br>' + esc(txt) : ''}</div></div>`;
    let h = `<h3 class="sheet-date">${fmtLong(s)}</h3>`;

    const schoolTxt = (schoolMap[s] || []).map(e => e.emoji + ' ' + e.label + (e.t ? ' (vorläufig)' : '')).join(' · ');
    const werkTxt = (werkMap[s] || []).map(e => e.emoji + ' ' + e.label).join(' · ');
    const unknown = s > SCHOOL_KNOWN_UNTIL && !schoolMap[s] && !we;

    h += row(sf ? '✅' : (unknown ? '❓' : '📚'), sf ? 'Schule frei' : (unknown ? 'Schule: Kalender 2027/28 noch offen' : 'Schule'), we && !schoolTxt ? 'Wochenende' : schoolTxt, sf ? 'ok-s' : '');
    h += row(wf ? '✅' : '🏭', wf ? 'Werk frei' : 'Werk: Arbeitstag', we && !werkTxt ? 'Wochenende' : werkTxt, wf ? 'ok-w' : '');
    (schoolInfoMap[s] || []).forEach(e => { h += row(e.emoji, 'Schule – Hinweis', e.label); });
    (deMap[s] || []).forEach(e => { h += row(e.emoji, 'Deutschland', e.label); });

    const trip = tripOn(s);
    if (trip) {
        const td = trip.days[s];
        h += `<a class="srow srow-trip" href="${trip.href}"><span class="srow-i">${trip.emoji}</span><div><strong>${esc(trip.name)}</strong> (${fmt(trip.from)}–${fmt(trip.to)})${td ? '<br>' + td[0] + ' ' + esc(td[1]) : ''}<br><span class="go">Zur Reiseseite →</span></div></a>`;
    }
    if (sharedRun[s]) {
        const r = sharedRun[s];
        h += row('🎉', 'Alle frei: ' + r.len + ' Tage am Stück', fmt(r.from) + ' – ' + fmt(r.to), 'ok-b');
    } else if (windowOf[s]) {
        const w = windowOf[s];
        h += row('🧳', 'Kinder frei: ' + w.len + (w.openEnd ? '+' : '') + ' Tage (' + fmt(w.from) + ' – ' + fmt(w.to) + ')',
            w.vacation ? 'Papa bräuchte ' + w.vacation + ' Urlaubstag' + (w.vacation === 1 ? '' : 'e') + ' für das ganze Fenster' : 'Papa hat auch frei');
    }

    document.getElementById('sheetBody').innerHTML = h;
    document.body.classList.add('sheet-open');
}
function closeSheet() { document.body.classList.remove('sheet-open'); }
document.getElementById('sheetBg').addEventListener('click', closeSheet);
document.getElementById('sheetClose').addEventListener('click', closeSheet);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSheet();
    if (e.key === 'Enter' && e.target.matches && e.target.matches('.cell[data-date]')) openSheet(e.target.dataset.date);
});

// --- Filter ---
['trips', 'de'].forEach(k => {
    const el = document.getElementById(k === 'trips' ? 'tgTrips' : 'tgDe');
    el.checked = prefs[k];
    el.addEventListener('change', () => { prefs[k] = el.checked; savePrefs(); renderMonths(); });
});

renderWindows();
renderMonths(true);
// Handy: Fenster-Liste eingeklappt starten, damit der Kalender schneller sichtbar ist
if (window.matchMedia('(max-width: 700px)').matches) document.getElementById('winBox').removeAttribute('open');
