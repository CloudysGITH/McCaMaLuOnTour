// ===== BERGER WINTER TOUR 2026 - Interactive Script =====
// Geruest-Version: Struktur wie Summer Tour 2026.
// TODO sobald Daten da sind: Abflugdatum, Tagebuch-Tage, Wetter-Orte, Firebase-Config.

// --- Password Lock ---
(function() {
    const UNLOCK_KEY = 'mccamalu_unlocked'; // gemeinsamer Unlock fuer Hub + beide Touren

    function checkCode(str) {
        // Ein Codewort fuer die ganze Mc CaMaLu Seite
        return str.toLowerCase().trim() === 'gruenesblatt';
    }

    const lockScreen = document.getElementById('lockScreen');
    const lockInput = document.getElementById('lockInput');
    const lockError = document.getElementById('lockError');
    const lockBtn = document.getElementById('lockBtn');

    // Check if already unlocked this session
    if (sessionStorage.getItem(UNLOCK_KEY) === 'true') {
        lockScreen.classList.add('unlocked');
        document.body.classList.remove('locked');
    } else {
        document.body.classList.add('locked');
    }

    lockBtn.addEventListener('click', tryUnlock);
    lockInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') tryUnlock();
    });

    function tryUnlock() {
        const value = lockInput.value;
        if (checkCode(value)) {
            sessionStorage.setItem(UNLOCK_KEY, 'true');
            lockScreen.classList.add('unlocked');
            document.body.classList.remove('locked');
            lockError.textContent = '';
        } else {
            lockError.textContent = 'Falsches Codewort! Versuch es nochmal.';
            lockInput.value = '';
            lockInput.focus();
            lockScreen.style.animation = 'shake 0.4s ease';
            setTimeout(() => lockScreen.style.animation = '', 400);
        }
    }
})();

// --- Schneefall ---
(function() {
    const layer = document.getElementById('snowLayer');
    if (!layer) return;

    const FLAKES = ['❄', '❅', '❆', '·', '•'];
    const COUNT = window.innerWidth < 600 ? 25 : 45;

    for (let i = 0; i < COUNT; i++) {
        const flake = document.createElement('span');
        flake.className = 'snowflake';
        flake.textContent = FLAKES[Math.floor(Math.random() * FLAKES.length)];
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.fontSize = (0.5 + Math.random() * 1.1) + 'rem';
        flake.style.opacity = (0.3 + Math.random() * 0.6).toFixed(2);
        flake.style.animationDuration = (8 + Math.random() * 14) + 's';
        flake.style.animationDelay = (-Math.random() * 20) + 's';
        layer.appendChild(flake);
    }
})();

// --- Countdown ---
const DEPARTURE = new Date('2026-12-19T22:10:00+07:00'); // Abflug BKK, Turkish Airlines (WP4DGY)

(function() {
    const els = [document.getElementById('countdown'), document.getElementById('countdownFooter')].filter(Boolean);
    if (!els.length) return;

    function update() {
        const now = new Date();
        const diff = DEPARTURE - now;
        if (diff <= 0) {
            els.forEach(el => el.innerHTML = '<span style="font-size:1.5rem;color:var(--pink)">DER WINTER IST DA! ❄️</span>');
            return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const html =
            '<div class="countdown-item"><span class="countdown-num">' + d + '</span><span class="countdown-label">Tage</span></div>' +
            '<div class="countdown-item"><span class="countdown-num">' + String(h).padStart(2,'0') + '</span><span class="countdown-label">Std</span></div>' +
            '<div class="countdown-item"><span class="countdown-num">' + String(m).padStart(2,'0') + '</span><span class="countdown-label">Min</span></div>' +
            '<div class="countdown-item"><span class="countdown-num">' + String(s).padStart(2,'0') + '</span><span class="countdown-label">Sek</span></div>';
        els[0].innerHTML = html;
        if (els[1]) els[1].textContent = 'Noch ' + d + ' Tage bis zum Abflug!';
    }
    update();
    setInterval(update, 1000);
})();

// --- Day Card Toggle ---
document.querySelectorAll('.day-header').forEach(header => {
    header.addEventListener('click', () => {
        const card = header.closest('.day-card');
        const content = card.querySelector('.day-content');
        const rating = card.querySelector('.day-rating');

        if (content) {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
        if (rating) {
            rating.style.display = rating.style.display === 'none' ? 'flex' : 'none';
        }
    });
});

// --- WHO AM I? (Name selection) ---
const MEMBER_KEY = 'bwt26_member';
const MEMBERS = ['Mark', 'Claudia', 'Carla', 'Luisa', 'Marlene'];
const MEMBER_ICONS = {
    'Mark': '⛷️',
    'Claudia': '👩‍💻',
    'Carla': '🐰',
    'Luisa': '🥞',
    'Marlene': '🏎️'
};

function getCurrentMember() {
    return localStorage.getItem(MEMBER_KEY);
}

function setCurrentMember(name) {
    localStorage.setItem(MEMBER_KEY, name);
}

function ensureMemberSelected(callback) {
    let member = getCurrentMember();
    if (member) { callback(member); return; }

    const overlay = document.createElement('div');
    overlay.className = 'member-picker-overlay';
    overlay.innerHTML = `
        <div class="member-picker">
            <h2>Wer bist du?</h2>
            <p>Waehle deinen Namen &ndash; deine Ratings und Tagebuch-Eintraege werden damit gespeichert.</p>
            <div class="member-picker-buttons">
                ${MEMBERS.map(m => `<button class="member-btn" data-name="${m}">${MEMBER_ICONS[m]} ${m}</button>`).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.member-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            setCurrentMember(name);
            overlay.remove();
            callback(name);
        });
    });
}

// --- Firebase-Helfer: ist die Config schon eingetragen? ---
function whenFirebaseReady(callback, onMissing) {
    if (window.firebaseReady) { callback(); return; }
    let done = false;
    window.addEventListener('firebase-ready', () => { done = true; callback(); });
    // Nach 1,5s ohne Firebase: Platzhalter-Modus
    setTimeout(() => { if (!done && !window.firebaseReady && onMissing) onMissing(); }, 1500);
}

// --- Star Ratings (Firebase - personal per member) ---
function initRatings() {
    whenFirebaseReady(() => {
        document.querySelectorAll('.day-rating').forEach(ratingEl => {
            const day = ratingEl.dataset.day;
            if (!day) return;
            const starsContainer = ratingEl.querySelector('.stars');
            const stars = ratingEl.querySelectorAll('.star');
            const display = ratingEl.querySelector('.rating-display');

            display.innerHTML = '';
            let myRating = 0;

            const ratingsRef = window.fbRef(window.fbDb, `ratings/${day}`);
            window.fbOnValue(ratingsRef, (snapshot) => {
                const data = snapshot.val() || {};
                const member = getCurrentMember();
                if (member) {
                    myRating = data[member] || 0;
                    updateStars(stars, myRating);
                }
                let html = '';
                MEMBERS.forEach(m => {
                    if (data[m]) {
                        const starStr = '⭐'.repeat(data[m]);
                        html += `<span class="member-rating">${MEMBER_ICONS[m]}${starStr}</span>`;
                    }
                });
                display.innerHTML = html;
            });

            stars.forEach(star => {
                star.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ensureMemberSelected((member) => {
                        const value = parseInt(star.dataset.value);
                        if (myRating === value) {
                            window.fbSet(window.fbRef(window.fbDb, `ratings/${day}/${member}`), null);
                        } else {
                            window.fbSet(window.fbRef(window.fbDb, `ratings/${day}/${member}`), value);
                        }
                    });
                });

                star.addEventListener('mouseenter', () => {
                    previewStars(stars, parseInt(star.dataset.value));
                });
            });

            starsContainer.addEventListener('mouseleave', () => {
                updateStars(stars, myRating);
            });
        });
    });
}

function updateStars(stars, value) {
    stars.forEach(s => {
        const active = parseInt(s.dataset.value) <= value;
        s.classList.toggle('active', active);
        s.style.filter = '';
        s.style.transform = '';
    });
}

function previewStars(stars, value) {
    stars.forEach(s => {
        const v = parseInt(s.dataset.value);
        s.style.filter = v <= value ? 'none' : 'grayscale(1) opacity(0.3)';
        s.style.transform = v <= value ? 'scale(1.2)' : 'scale(1)';
    });
}

initRatings();

// --- Checklist Persistence ---
const CHECKLIST_KEY = 'bwt26_checklists';

function loadChecklists() {
    try {
        return JSON.parse(localStorage.getItem(CHECKLIST_KEY)) || {};
    } catch {
        return {};
    }
}

function saveChecklists(data) {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(data));
}

function initChecklists() {
    const data = loadChecklists();

    document.querySelectorAll('input[type="checkbox"]').forEach((cb, index) => {
        const key = `check_${index}`;

        if (data[key]) {
            cb.checked = true;
            cb.closest('label').style.opacity = '0.5';
            cb.closest('label').style.textDecoration = 'line-through';
        }

        cb.addEventListener('change', () => {
            data[key] = cb.checked;
            saveChecklists(data);

            if (cb.checked) {
                cb.closest('label').style.opacity = '0.5';
                cb.closest('label').style.textDecoration = 'line-through';
            } else {
                cb.closest('label').style.opacity = '1';
                cb.closest('label').style.textDecoration = 'none';
            }
        });
    });
}

initChecklists();

// --- XP Tracker ---
const XP_KEY = 'bwt26_xp';

function loadXP() {
    try {
        return JSON.parse(localStorage.getItem(XP_KEY)) || {
            mark: 0, claudia: 0, carla: 0, luisa: 0, marlene: 0
        };
    } catch {
        return { mark: 0, claudia: 0, carla: 0, luisa: 0, marlene: 0 };
    }
}

function saveXP(xp) {
    localStorage.setItem(XP_KEY, JSON.stringify(xp));
}

function updateXPDisplay(xp) {
    const maxXP = 500;
    Object.keys(xp).forEach(name => {
        const fill = document.getElementById(`xp-${name}`);
        const val = document.getElementById(`xp-${name}-val`);
        if (fill && val) {
            const pct = Math.min((xp[name] / maxXP) * 100, 100);
            fill.style.width = pct + '%';
            val.textContent = xp[name] + ' XP';
        }
    });
}

function initXPTracker() {
    const xp = loadXP();
    updateXPDisplay(xp);

    Object.keys(xp).forEach(name => {
        const val = document.getElementById(`xp-${name}-val`);
        if (val) {
            val.style.cursor = 'pointer';
            val.title = 'Klicke zum Bearbeiten';
            val.addEventListener('click', () => {
                const input = prompt(`XP fuer ${name.charAt(0).toUpperCase() + name.slice(1)} eingeben:`, xp[name]);
                if (input !== null) {
                    const num = parseInt(input);
                    if (!isNaN(num) && num >= 0) {
                        xp[name] = num;
                        saveXP(xp);
                        updateXPDisplay(xp);
                    }
                }
            });
        }
    });
}

initXPTracker();

// --- Scroll Animations ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.day-card, .hotel-card, .quest-card, .weather-card, .crew-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
});

// --- Diary / Tagebuch (Firebase - shared) ---
(function() {
    const container = document.getElementById('diaryContainer');
    if (!container) return;

    // Reisetage 19.12.2026 - 08.01.2027 (Titel werden mit der Detailplanung verfeinert)
    const days = [
        // Phase 1: Anreise
        { date: '2026-12-19', label: 'Sa 19. Dez', loc: 'Bangkok → Istanbul', title: 'Abflug! Los geht die Winter Tour', prompt: 'Wie war der Abflug um 22:10? Aufregung? Wer hat im Flieger geschlafen?' },
        { date: '2026-12-20', label: 'So 20. Dez', loc: 'München → Nürnberg', title: '\u{1F384} Ankunft, Carla-Reunion & Christkindlesmarkt!', prompt: 'REUNION! Wie war das Wiedersehen mit Carla? Erster Glühwein nach 5 Jahren Bangkok – wie war die Weihnachtsstimmung? Drei im Weggla probiert?' },
        // Phase 2: Hepberg -> Bonn (geplant)
        { date: '2026-12-21', label: 'Mo 21. Dez', loc: 'Hepberg', title: 'Tag bei Familie Jantz', prompt: 'Jetlag besiegt? Was habt ihr mit Familie Jantz unternommen?' },
        { date: '2026-12-22', label: 'Di 22. Dez', loc: 'Hepberg → Bonn', title: 'Fahrt nach Bonn – zu Oma & Opa!', prompt: 'Wie war die Fahrt? Wiedersehen mit Oma & Opa nach so langer Zeit?' },
        { date: '2026-12-23', label: 'Mi 23. Dez', loc: 'Bonn', title: 'Bonn – Weihnachtsvorbereitungen', prompt: 'Bonner Weihnachtsmarkt? Letzte Geschenke? Plätzchen mit Oma?' },
        { date: '2026-12-24', label: 'Do 24. Dez', loc: 'Bonn', title: '\u{1F384} Heiligabend bei Oma & Opa!', prompt: 'Bescherung! Bestes Geschenk? Was gab es zu essen? Wer hat geweint vor Rührung?' },
        { date: '2026-12-25', label: 'Fr 25. Dez', loc: 'Bonn', title: '1. Weihnachtstag in Bonn', prompt: 'Weihnachts-Food-Koma? Rheinspaziergang? Erzählt!' },
        // Phase 3: Kaunertal
        { date: '2026-12-26', label: 'Sa 26. Dez', loc: 'Bonn → Kaunertal', title: 'Lange Fahrt & Check-in Apart Gletscherblick!', prompt: 'Wie war die 7h-Etappe? Erster Eindruck vom Kaunertal und der Wohnung? Liegt Schnee?' },
        { date: '2026-12-27', label: 'So 27. Dez', loc: 'Kaunertaler Gletscher', title: '\u{1F3BF} Skitag 1 – Gletscher!', prompt: 'Erster Tag auf der Piste! Wie waren Schnee und Beine?' },
        { date: '2026-12-28', label: 'Mo 28. Dez', loc: 'Kaunertal', title: 'Skitag 2', prompt: 'Gletscher oder Fendels? Schönste Abfahrt?' },
        { date: '2026-12-29', label: 'Di 29. Dez', loc: 'Kaunertal', title: 'Skitag 3', prompt: 'Muskelkater-Update? Bestes Hüttenessen bisher?' },
        { date: '2026-12-30', label: 'Mi 30. Dez', loc: 'Kaunertal', title: 'Skitag 4', prompt: 'Was war heute besonders?' },
        { date: '2026-12-31', label: 'Do 31. Dez', loc: 'Kaunertal', title: '\u{1F386} Silvester in den Bergen!', prompt: 'Wie habt ihr reingefeiert? Feuerwerk überm Tal? Vorsätze für 2027?' },
        { date: '2027-01-01', label: 'Fr 1. Jan', loc: 'Kaunertal', title: 'Neujahr – Skitag oder Ausschlafen?', prompt: 'Frohes Neues! Erster Skitag 2027 oder gemütlicher Start?' },
        { date: '2027-01-02', label: 'Sa 2. Jan', loc: 'Kaunertal', title: 'Skitag', prompt: 'Highlight des Tages?' },
        { date: '2027-01-03', label: 'So 3. Jan', loc: 'Kaunertal → ?', title: 'Check-out Apart Gletscherblick', prompt: 'Abschied vom Kaunertal – was werdet ihr vermissen? Wohin geht’s jetzt?' },
        // Phase 4: Nach-Ski (Plan folgt)
        { date: '2027-01-04', label: 'Mo 4. Jan', loc: 'folgt', title: 'Nach-Ski-Phase – letzter Skipass-Tag!', prompt: 'Skipass gilt noch – nochmal auf die Piste oder schon weitergezogen?' },
        { date: '2027-01-05', label: 'Di 5. Jan', loc: 'folgt', title: 'Nach-Ski-Phase – Tag 2', prompt: 'Was habt ihr heute gemacht?' },
        { date: '2027-01-06', label: 'Mi 6. Jan', loc: 'folgt', title: 'Heilige Drei Könige (Feiertag in AT!)', prompt: 'Sternsinger gesehen? Was stand an?' },
        { date: '2027-01-07', label: 'Do 7. Jan', loc: 'folgt', title: 'Letzter voller Tag in Europa', prompt: 'Koffer packen – was MUSS mit nach Bangkok?' },
        // Phase 5: Rueckflug
        { date: '2027-01-08', label: 'Fr 8. Jan', loc: 'München → Bangkok', title: '✈️ Rückflug – Ende der Winter Tour', prompt: 'Was war das BESTE Erlebnis der ganzen Reise? Jeder ein Highlight!' },
    ];

    function buildDiary(liveMode) {
        days.forEach(day => {
            const dateKey = day.date.replace(/-/g, '');
            const entry = document.createElement('div');
            entry.className = 'diary-entry';
            entry.innerHTML = `
                <div class="diary-header">
                    <span class="diary-date-badge">${day.label}</span>
                    <div class="diary-header-info">
                        <h4>${day.title}</h4>
                        <span class="diary-loc">📍 ${day.loc}</span>
                    </div>
                    <span class="diary-indicator"></span>
                </div>
                <div class="diary-body" style="display:none;">
                    <p class="diary-prompt">${day.prompt}</p>
                    <div class="diary-entries-list"></div>
                    <div class="diary-write">
                        <textarea placeholder="Dein Eintrag fuer heute..."></textarea>
                        <button class="diary-submit-btn">Eintrag speichern</button>
                        <p class="diary-saved">Gespeichert!</p>
                    </div>
                </div>
            `;

            const header = entry.querySelector('.diary-header');
            const body = entry.querySelector('.diary-body');
            const entriesList = entry.querySelector('.diary-entries-list');
            const textarea = entry.querySelector('textarea');
            const submitBtn = entry.querySelector('.diary-submit-btn');
            const savedMsg = entry.querySelector('.diary-saved');
            const indicator = entry.querySelector('.diary-indicator');

            header.addEventListener('click', () => {
                body.style.display = body.style.display === 'none' ? 'block' : 'none';
            });

            if (!liveMode) {
                entriesList.innerHTML = '<p class="diary-empty">Tagebuch wird aktiviert, sobald die Firebase-Config eingetragen ist.</p>';
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
            } else {
                const diaryRef = window.fbRef(window.fbDb, `diary/${dateKey}`);
                window.fbOnValue(diaryRef, (snapshot) => {
                    const entries = snapshot.val() || {};
                    const sorted = Object.values(entries).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

                    if (sorted.length > 0) {
                        indicator.textContent = `✏️ ${sorted.length} Eintrag${sorted.length > 1 ? 'e' : ''}`;
                        entriesList.innerHTML = sorted.map(e => `
                            <div class="diary-entry-item">
                                <div class="diary-entry-meta">
                                    <span class="diary-author">${MEMBER_ICONS[e.author] || ''} ${e.author}</span>
                                    <span class="diary-time">${e.time || ''}</span>
                                </div>
                                <p class="diary-entry-text">${(e.text || '').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>
                            </div>
                        `).join('');
                    } else {
                        indicator.textContent = '';
                        entriesList.innerHTML = '<p class="diary-empty">Noch keine Eintraege &ndash; sei der Erste!</p>';
                    }
                });

                submitBtn.addEventListener('click', () => {
                    const text = textarea.value.trim();
                    if (!text) return;

                    ensureMemberSelected((member) => {
                        const now = new Date();
                        const timeStr = now.toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
                        const newEntryRef = window.fbPush(window.fbRef(window.fbDb, `diary/${dateKey}`));
                        window.fbSet(newEntryRef, {
                            author: member,
                            text: text,
                            time: timeStr,
                            timestamp: now.getTime()
                        });
                        textarea.value = '';
                        savedMsg.classList.add('show');
                        setTimeout(() => savedMsg.classList.remove('show'), 2000);
                    });
                });
            }

            container.appendChild(entry);
        });
    }

    whenFirebaseReady(
        () => buildDiary(true),
        () => buildDiary(false)
    );
})();

// --- Mobile Nav Toggle ---
const navToggle = document.getElementById('navToggle');
const navLinksEl = document.getElementById('navLinks');

if (navToggle && navLinksEl) {
    navToggle.addEventListener('click', () => {
        navLinksEl.classList.toggle('open');
        navToggle.textContent = navLinksEl.classList.contains('open') ? '✕' : '☰';
    });

    navLinksEl.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinksEl.classList.remove('open');
            navToggle.textContent = '☰';
        });
    });
}

// --- Live Weather from Open-Meteo ---
(function() {
    // Reise-Orte (TODO: 20.-26.12. und 03.-08.01. ergaenzen, sobald der Plan steht)
    const locations = [
        { name: 'München → Nürnberg', lat: 49.4541, lon: 11.0775, from: '2026-12-19', to: '2026-12-20', snow: false },
        { name: 'Hepberg', lat: 48.8120, lon: 11.4640, from: '2026-12-21', to: '2026-12-21', snow: false },
        { name: 'Bonn', lat: 50.7374, lon: 7.0982, from: '2026-12-22', to: '2026-12-25', snow: false },
        { name: 'Kaunertal / Feichten', lat: 47.005, lon: 10.713, from: '2026-12-26', to: '2027-01-03', snow: true },
        { name: 'Nach-Ski-Phase (Ort folgt)', lat: 47.005, lon: 10.713, from: '2027-01-04', to: '2027-01-07', snow: true },
        { name: 'München (Rückflug)', lat: 48.3537, lon: 11.7861, from: '2027-01-08', to: '2027-01-08', snow: false },
    ];

    const WMO_CODES = {
        0: { icon: '☀️', text: 'Klar' },
        1: { icon: '🌤️', text: 'Ueberwiegend klar' },
        2: { icon: '⛅', text: 'Teilweise bewoelkt' },
        3: { icon: '☁️', text: 'Bedeckt' },
        45: { icon: '🌫️', text: 'Nebel' },
        48: { icon: '🌫️', text: 'Reifnebel' },
        51: { icon: '🌦️', text: 'Leichter Nieselregen' },
        53: { icon: '🌦️', text: 'Nieselregen' },
        55: { icon: '🌧️', text: 'Starker Nieselregen' },
        61: { icon: '🌧️', text: 'Leichter Regen' },
        63: { icon: '🌧️', text: 'Regen' },
        65: { icon: '🌧️', text: 'Starker Regen' },
        71: { icon: '🌨️', text: 'Leichter Schneefall' },
        73: { icon: '🌨️', text: 'Schneefall' },
        75: { icon: '❄️', text: 'Starker Schneefall' },
        77: { icon: '❄️', text: 'Schneegriesel' },
        80: { icon: '🌦️', text: 'Leichte Schauer' },
        81: { icon: '🌧️', text: 'Schauer' },
        82: { icon: '⛈️', text: 'Starke Schauer' },
        85: { icon: '🌨️', text: 'Leichte Schneeschauer' },
        86: { icon: '❄️', text: 'Starke Schneeschauer' },
        95: { icon: '⛈️', text: 'Gewitter' },
        96: { icon: '⛈️', text: 'Gewitter mit Hagel' },
        99: { icon: '⛈️', text: 'Gewitter mit starkem Hagel' },
    };

    const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

    function getCurrentLocation(today) {
        const todayMs = today.getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        for (const loc of locations) {
            const from = new Date(loc.from + 'T00:00:00');
            const to = new Date(loc.to + 'T23:59:59');
            if (todayMs >= from.getTime() && todayMs <= to.getTime()) {
                return { current: loc };
            }
        }

        const firstFrom = new Date(locations[0].from + 'T00:00:00');
        if (todayMs < firstFrom.getTime() && (firstFrom.getTime() - todayMs) <= sevenDays) {
            return { current: locations[0], preTrip: true };
        }

        return null;
    }

    function isSnowPhase(today) {
        const todayMs = today.getTime();
        for (const loc of locations) {
            if (!loc.snow) continue;
            const from = new Date(loc.from + 'T00:00:00');
            const to = new Date(loc.to + 'T23:59:59');
            const earlyFrom = new Date(from);
            earlyFrom.setDate(earlyFrom.getDate() - 2);
            if (todayMs >= earlyFrom.getTime() && todayMs <= to.getTime()) return true;
        }
        return false;
    }

    async function fetchWeather(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum,wind_speed_10m_max,sunrise,sunset&timezone=auto&forecast_days=3`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Weather API error');
        return resp.json();
    }

    function renderForecast(data, locationName, container) {
        const days = data.daily;
        let html = `
            <div class="live-weather-header">
                <h3>📍 ${locationName} &ndash; Live 3-Tage-Vorschau</h3>
                <p>Daten von Open-Meteo (aktualisiert sich automatisch)</p>
            </div>
            <div class="live-forecast-grid">
        `;

        for (let i = 0; i < days.time.length; i++) {
            const date = new Date(days.time[i] + 'T12:00:00');
            const weekday = WEEKDAYS[date.getDay()];
            const dayNum = date.getDate();
            const month = date.toLocaleString('de-DE', { month: 'short' });
            const code = days.weather_code[i];
            const weather = WMO_CODES[code] || { icon: '❓', text: 'Unbekannt' };
            const isToday = i === 0 ? ' today' : '';
            const snow = days.snowfall_sum && days.snowfall_sum[i] > 0
                ? `<span>❄️ ${days.snowfall_sum[i].toFixed(1)} cm Neuschnee</span>`
                : '';

            html += `
                <div class="forecast-day${isToday}">
                    <div class="forecast-date">${weekday}, ${dayNum}. ${month}</div>
                    <div class="forecast-icon">${weather.icon}</div>
                    <div class="forecast-temps">
                        <span class="forecast-high">${Math.round(days.temperature_2m_max[i])}&deg;</span>
                        <span class="forecast-low">${Math.round(days.temperature_2m_min[i])}&deg;</span>
                    </div>
                    <div class="forecast-details">
                        <span>${weather.text}</span>
                        <span>🌧️ ${days.precipitation_probability_max[i] || 0}% Niederschlag</span>
                        ${snow}
                        <span>🌬️ ${Math.round(days.wind_speed_10m_max[i])} km/h Wind</span>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        html += '<p class="live-weather-note">Quelle: Open-Meteo.com &ndash; Vorhersage max. 7 Tage im Voraus verf&uuml;gbar</p>';
        container.innerHTML = html;
    }

    async function init() {
        const container = document.getElementById('liveWeather');
        const snowSection = document.getElementById('snowSection');
        const today = new Date();

        if (isSnowPhase(today)) {
            snowSection.style.display = 'block';
        }

        const locInfo = getCurrentLocation(today);

        if (!locInfo) {
            container.innerHTML = '<div class="live-weather-loading">Live-Wetter wird ab 7 Tage vor Abreise angezeigt &ndash; sobald Reisedaten &amp; Orte eingetragen sind.</div>';
            return;
        }

        const loc = locInfo.current;

        try {
            const data = await fetchWeather(loc.lat, loc.lon);
            const label = locInfo.preTrip
                ? `${loc.name} (Vorschau vor Anreise)`
                : loc.name;
            renderForecast(data, label, container);
        } catch (err) {
            container.innerHTML = '<div class="live-weather-loading">Wetterdaten konnten nicht geladen werden. Bitte spaeter nochmal versuchen.</div>';
        }
    }

    init();
})();

// --- Nav highlight on scroll ---
const sections = document.querySelectorAll('.section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollY >= top && scrollY < top + height) {
            navLinks.forEach(link => {
                link.style.color = link.getAttribute('href') === '#' + id
                    ? '#e8e8ed'
                    : '#8ba0bd';
            });
        }
    });
});

// --- Kosten-Tracker Summen ---
function getFixedSum() {
    let s = 0;
    document.querySelectorAll('.cost-val[data-amount]').forEach(c => { s += parseFloat(c.dataset.amount) || 0; });
    return s;
}
function updateCostDisplay(expenseSum) {
    const fmt = v => v.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
    const fixed = getFixedSum();
    const el = id => document.getElementById(id);
    if (el('costFixed')) el('costFixed').textContent = fmt(fixed);
    if (el('costOnTheGo')) el('costOnTheGo').textContent = fmt(expenseSum || 0);
    if (el('costTotal')) el('costTotal').textContent = fmt(fixed + (expenseSum || 0));
}
updateCostDisplay(0);

// --- Live Ausgaben-Tracker (Firebase) ---
(function() {
    const CAT_ICONS = {
        restaurant: '🍽️', gluehwein: '☕', skipass: '🎿',
        sprit: '⛽', maut: '🛣️', supermarkt: '🛒',
        aktivitaet: '⛷️', geschenke: '🎁',
        parken: '🅿️', sonstiges: '💶'
    };
    const CAT_LABELS = {
        restaurant: 'Restaurant', gluehwein: 'Glühwein & Kakao', skipass: 'Skipass / Rodel',
        sprit: 'Sprit', maut: 'Maut / Vignette', supermarkt: 'Supermarkt',
        aktivitaet: 'Aktivität', geschenke: 'Geschenke',
        parken: 'Parken', sonstiges: 'Sonstiges'
    };

    const dateInput = document.getElementById('expDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    const submitBtn = document.getElementById('expSubmit');
    if (!submitBtn) return;

    function initExpenses() {
        const expRef = window.fbRef(window.fbDb, 'expenses');

        window.fbOnValue(expRef, (snapshot) => {
            const data = snapshot.val() || {};
            renderExpenses(data);
        });

        submitBtn.addEventListener('click', () => {
            const cat = document.getElementById('expCat').value;
            const amount = parseFloat(document.getElementById('expAmount').value);
            const desc = document.getElementById('expDesc').value.trim();
            const date = document.getElementById('expDate').value;

            if (!cat || !amount || !date) {
                submitBtn.textContent = 'Bitte alles ausfüllen!';
                setTimeout(() => { submitBtn.textContent = 'Eintragen'; }, 2000);
                return;
            }

            const newRef = window.fbPush(expRef);
            window.fbSet(newRef, {
                cat: cat,
                amount: amount,
                desc: desc,
                date: date,
                ts: Date.now()
            });

            document.getElementById('expCat').value = '';
            document.getElementById('expAmount').value = '';
            document.getElementById('expDesc').value = '';
            document.getElementById('expDate').valueAsDate = new Date();

            submitBtn.textContent = 'Gespeichert!';
            setTimeout(() => { submitBtn.textContent = 'Eintragen'; }, 1500);
        });
    }

    function renderExpenses(data) {
        const list = document.getElementById('expenseList');
        const totalEl = document.getElementById('expenseTotal');
        if (!list) return;

        const entries = Object.entries(data).map(([id, e]) => ({ id, ...e }));
        entries.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.ts || 0) - (a.ts || 0));

        let total = 0;
        entries.forEach(e => { total += e.amount || 0; });
        if (totalEl) totalEl.textContent = total.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
        updateCostDisplay(total);

        if (entries.length === 0) {
            list.innerHTML = '<p class="expense-empty">Noch keine Ausgaben eingetragen. Startet auf der Reise!</p>';
            return;
        }

        const grouped = {};
        entries.forEach(e => {
            const d = e.date || 'Unbekannt';
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(e);
        });

        let html = '';
        Object.keys(grouped).sort((a, b) => b.localeCompare(a)).forEach(date => {
            const dayTotal = grouped[date].reduce((s, e) => s + (e.amount || 0), 0);
            const dateObj = new Date(date + 'T12:00:00');
            const dateStr = dateObj.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
            html += '<div class="expense-day">';
            html += '<div class="expense-day-header"><span>' + dateStr + '</span><span class="expense-day-total">' + dayTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €</span></div>';
            grouped[date].forEach(e => {
                const icon = CAT_ICONS[e.cat] || '💶';
                const label = CAT_LABELS[e.cat] || e.cat;
                html += '<div class="expense-item">';
                html += '<span class="expense-icon">' + icon + '</span>';
                html += '<div class="expense-item-info"><span class="expense-item-desc">' + (e.desc || label) + '</span><span class="expense-item-meta">' + label + '</span></div>';
                html += '<span class="expense-item-amount">' + (e.amount || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €</span>';
                html += '</div>';
            });
            html += '</div>';
        });
        list.innerHTML = html;
    }

    whenFirebaseReady(initExpenses, () => {
        const list = document.getElementById('expenseList');
        if (list) list.innerHTML = '<p class="expense-empty">Reisekasse wird aktiviert, sobald die Firebase-Config eingetragen ist.</p>';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
    });
})();

// --- Phase Toggle (ein-/ausklappen, Standard: zugeklappt) ---
document.querySelectorAll('.phase-label').forEach((label, i) => {
    const text = label.textContent;
    label.innerHTML = '<span>' + text + '</span>';

    const content = [];
    let sibling = label.nextElementSibling;
    while (sibling && !sibling.classList.contains('phase-label')) {
        content.push(sibling);
        sibling = sibling.nextElementSibling;
    }
    const wrapper = document.createElement('div');
    wrapper.classList.add('phase-content');
    label.parentNode.insertBefore(wrapper, content[0]);
    content.forEach(el => wrapper.appendChild(el));

    if (i === 0) {
        const hint = document.createElement('div');
        hint.classList.add('phase-hint');
        hint.textContent = 'Klick auf einen Termin um Details aufzuklappen';
        label.parentNode.insertBefore(hint, wrapper);
    }

    if (label.classList.contains('phase-label-warning')) {
        label.classList.add('expanded');
        wrapper.classList.add('expanded');
    }

    label.addEventListener('click', () => {
        label.classList.toggle('expanded');
        wrapper.classList.toggle('expanded');
    });
});
