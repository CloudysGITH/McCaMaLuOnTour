// ===== BERGER SUMMER TOUR 2026 - Interactive Script =====

// --- Codewort-Login (Firebase) ---
// Das Codewort ist das Passwort eines gemeinsamen Familien-Accounts. Erfolgreicher
// Login entsperrt die Seite UND oeffnet die Datenbank - beides mit einer Eingabe.
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

    // Bereits angemeldet (gespeicherte Sitzung)? Dann direkt rein.
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

// --- Countdown ---
function updateCountdown() {
    const departure = new Date('2026-06-20T06:40:00+07:00');
    const now = new Date();
    const diff = departure - now;

    if (diff <= 0) {
        document.getElementById('countdown').textContent = 'DER SOMMER IST DA!';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    document.getElementById('countdown').textContent =
        `Noch ${days} Tage, ${hours} Stunden und ${minutes} Minuten bis zum Abflug!`;
}

updateCountdown();
setInterval(updateCountdown, 60000);

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
const MEMBER_KEY = 'bst26_member';
const MEMBERS = ['Mark', 'Claudia', 'Carla', 'Luisa', 'Marlene'];
const MEMBER_ICONS = {
    'Mark': '\uD83D\uDC68\u200D\uD83D\uDCBC',
    'Claudia': '\uD83D\uDC69\u200D\uD83D\uDCBB',
    'Carla': '\uD83C\uDF1F',
    'Luisa': '\uD83C\uDFB6',
    'Marlene': '\uD83C\uDFD6\uFE0F'
};

function getCurrentMember() {
    return localStorage.getItem(MEMBER_KEY);
}

function setCurrentMember(name) {
    localStorage.setItem(MEMBER_KEY, name);
}

// Show member picker if not set
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

// --- Star Ratings (Firebase - personal per member) ---
function initRatings() {
    function waitForFirebase() {
        if (!window.firebaseReady) {
            window.addEventListener('firebase-ready', () => setupRatings());
        } else {
            setupRatings();
        }
    }

    function setupRatings() {
        document.querySelectorAll('.day-rating').forEach(ratingEl => {
            const day = ratingEl.dataset.day;
            if (!day) return;
            const starsContainer = ratingEl.querySelector('.stars');
            const stars = ratingEl.querySelectorAll('.star');
            const display = ratingEl.querySelector('.rating-display');

            display.innerHTML = '';
            let myRating = 0;

            // Listen for ALL ratings on this day (real-time)
            const ratingsRef = window.fbRef(window.fbDb, `ratings/${day}`);
            window.fbOnValue(ratingsRef, (snapshot) => {
                const data = snapshot.val() || {};
                // Update my rating from DB
                const member = getCurrentMember();
                if (member) {
                    myRating = data[member] || 0;
                    updateStars(stars, myRating);
                }
                // Show all family ratings
                let html = '';
                MEMBERS.forEach(m => {
                    if (data[m]) {
                        const starStr = '\u2B50'.repeat(data[m]);
                        html += `<span class="member-rating">${MEMBER_ICONS[m]}${starStr}</span>`;
                    }
                });
                display.innerHTML = html;
            });

            // Click to rate
            stars.forEach(star => {
                star.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ensureMemberSelected((member) => {
                        const value = parseInt(star.dataset.value);
                        if (myRating === value) {
                            // Same star = delete rating
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
    }

    waitForFirebase();
}

function updateStars(stars, value) {
    stars.forEach(s => {
        const active = parseInt(s.dataset.value) <= value;
        s.classList.toggle('active', active);
        // Clear any inline styles from previewStars
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
const CHECKLIST_KEY = 'bst26_checklists';

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

        // Restore
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
const XP_KEY = 'bst26_xp';

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

// Make XP editable by clicking on the value
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

    const days = [
        // Phase 1: Frankreich
        { date: '2026-06-20', label: 'Sa 20. Jun', loc: 'Bordeaux', title: 'Anreisetag Bangkok \u2192 Bordeaux', prompt: 'Wie war der Flug? Erster Eindruck von Bordeaux?' },
        { date: '2026-06-21', label: 'So 21. Jun', loc: 'Ile d\u2019Ol\u00e9ron', title: 'Reunion auf Oleron!', prompt: 'Wie war das Wiedersehen mit Marlene? Erster Strand-Moment?' },
        { date: '2026-06-22', label: 'Mo 22. Jun', loc: 'Ile d\u2019Ol\u00e9ron', title: 'Fahrrad-Tour & Austern', prompt: 'Wer ist am weitesten gefahren? Wie schmecken Austern?' },
        { date: '2026-06-23', label: 'Di 23. Jun', loc: 'La Rochelle', title: 'La Rochelle \u2013 Hafenstadt-Vibes', prompt: 'Beste Entdeckung in La Rochelle? Bestes Essen?' },
        { date: '2026-06-24', label: 'Mi 24. Jun', loc: 'Ile d\u2019Ol\u00e9ron', title: 'Markt-Tag & Chill', prompt: 'Was habt ihr auf dem Markt entdeckt? Bester Kaese?' },
        { date: '2026-06-25', label: 'Do 25. Jun', loc: 'Cognac, Saintes & Marennes', title: 'Cognac & Saintes + Rotary-Clubabend', prompt: 'Cognac-Verkostung? Wie war das Amphitheater? Und der Wimpeltausch beim Rotary Club?' },
        { date: '2026-06-26', label: 'Fr 26. Jun', loc: 'Grand-Village, Saint-Trojan & La Cotini\u00e8re', title: 'Char \u00e0 Voile, P\u2019tit Train & Langoustinade', prompt: 'Wie war Strandsegler fahren? Und die Langoustinade \u2013 wie viele Langustinen wurden vernichtet? \u{1F990}' },
        { date: '2026-06-27', label: 'Sa 27. Jun', loc: 'Vert Bois & Ch\u00e2teau d\u2019Ol\u00e9ron', title: 'Surfkurs & Couleurs Cabanes', prompt: 'Wer stand am laengsten auf dem Board? Coolstes Atelier?' },
        { date: '2026-06-28', label: 'So 28. Jun', loc: 'Boyardville & Ile d\u2019Aix', title: 'Fort Boyard & Ile d\u2019Aix Abenteuer', prompt: 'Fort Boyard aus der Naehe! Wie war die Ile d\u2019Aix?' },
        { date: '2026-06-29', label: 'Mo 29. Jun', loc: 'Chassiron & La Cotini\u00e8re', title: 'Letzter Tag \u2013 Chassiron & Farewell Sunset', prompt: 'Abschiedsstimmung? Was werdet ihr am meisten vermissen?' },
        // Phase 2: Road Trip
        { date: '2026-06-30', label: 'Di 30. Jun', loc: 'Ol\u00e9ron \u2192 Beaune', title: 'Road Trip nach Beaune (Burgund)', prompt: 'Wie war die lange Fahrt? Erster Eindruck von Beaune?' },
        // Phase 3: Deutschland-Tour
        { date: '2026-07-01', label: 'Mi 1. Jul', loc: 'Sindelfingen', title: 'Ankunft in Sindelfingen', prompt: 'Endlich Zuhause! Was war das Erste, was ihr gemacht habt?' },
        { date: '2026-07-02', label: 'Do 2. Jul', loc: 'Sindelfingen', title: 'Tag in Sindelfingen', prompt: 'Freunde getroffen? Was steht an?' },
        { date: '2026-07-03', label: 'Fr 3. Jul', loc: 'Sindelfingen \u2192 Mannheim \u2192 Bonn', title: 'Mannheim Schl\u00fcsselbergabe & Shopping, abends Bonn', prompt: 'Wie war die Schl\u00fcsselbergabe? Erste Eindr\u00fccke von Carlas Wohnung & Mannheim? Ankunft bei Oma & Opa?' },
        // Phase 4: Bonn 03.-07.07. (4 Naechte) \u2013 danach Mannheim 07.-10.07. (Mercure + Carlas Wohnung einrichten)
        { date: '2026-07-04', label: 'Sa 4. Jul', loc: 'Bonn', title: 'Bonn \u2013 Tag 1 bei Oma & Opa', prompt: 'Erster Tag in Bonn! Was hat Oma geplant?' },
        { date: '2026-07-05', label: 'So 5. Jul', loc: 'Bonn', title: 'Bonn \u2013 Tag 2 bei Oma & Opa', prompt: 'Highlight heute? Bestes Essen bei Oma?' },
        { date: '2026-07-06', label: 'Mo 6. Jul', loc: 'Bonn', title: 'Bonn \u2013 Tag 3 bei Oma & Opa', prompt: 'Was war heute besonders?' },
        { date: '2026-07-07', label: 'Di 7. Jul', loc: 'Bonn \u2192 Mannheim', title: 'Bett-Mission! Bonn \u2192 Mannheim, Wohnung einziehen', prompt: 'BETT AUFGEBAUT? Wie war die Fahrt, der IKEA-Run, die erste Nacht im neuen Zuhause?' },
        { date: '2026-07-08', label: 'Mi 8. Jul', loc: 'Mannheim', title: 'Wohnung einrichten + Mannheim entdecken', prompt: 'Was steht schon, was fehlt noch? Wie wirkt Mannheim auf euch?' },
        { date: '2026-07-09', label: 'Do 9. Jul', loc: 'Mannheim / Heidelberg', title: 'Feinschliff Wohnung + Heidelberg-Trip?', prompt: 'Wohnung fertig? Heidelberg geschafft? Carlas Hood-Gefuehl?' },
        // Phase 5: Muenchen
        { date: '2026-07-10', label: 'Fr 10. Jul', loc: 'Bonn \u2192 M\u00fcnchen', title: 'Lange Fahrt nach M\u00fcnchen \u2013 bei Jochen & Rossi', prompt: 'Wie war die 6h-Fahrt? Erster Abend bei Jochen & Rossi?' },
        { date: '2026-07-11', label: 'Sa 11. Jul', loc: 'M\u00fcnchen \u2192 Passau', title: 'Mark fliegt zur\u00fcck \u2013 M\u00e4dels weiter nach Passau', prompt: 'Abschied von Mark am Flughafen! Wie geht es ohne Papa weiter?' },
        // Passau (M\u00e4dels-Zeit)
        { date: '2026-07-12', label: 'So 12. Jul', loc: 'Passau', title: 'Passau \u2013 Tag 1 bei Freunden', prompt: 'Angekommen in Passau! Erster Eindruck?' },
        { date: '2026-07-13', label: 'Mo 13. Jul', loc: 'Passau', title: 'Passau \u2013 Tag 2', prompt: 'Was habt ihr heute erlebt?' },
        { date: '2026-07-14', label: 'Di 14. Jul', loc: 'Passau', title: 'Passau \u2013 Tag 3', prompt: 'Highlight des Tages?' },
        { date: '2026-07-15', label: 'Mi 15. Jul', loc: 'Passau', title: 'Passau \u2013 Tag 4', prompt: 'Letzter ganzer Tag in Passau \u2013 was war besonders?' },
        // Ingolstadt (Hinweg) bei Anett
        { date: '2026-07-16', label: 'Do 16. Jul', loc: 'Passau \u2192 Ingolstadt', title: 'Fahrt nach Ingolstadt \u2013 bei Anett & Familie', prompt: 'Wiedersehen mit Anett, Robert, Nela & Sina \u2013 wie war das?' },
        { date: '2026-07-17', label: 'Fr 17. Jul', loc: 'Ingolstadt \u2192 Sindelfingen', title: 'Abreise Ingolstadt & Carlas GGS Abi-Ball!', prompt: 'Wie war Carlas Abi-Ball? Wiedersehen mit der alten Klasse?' },
        // Mannheim: Wohnung einrichten 18.-26.07. // Marlene Oleron-Re-Trip 18.-25.07.
        { date: '2026-07-18', label: 'Sa 18. Jul', loc: 'Mannheim / Bordeaux', title: 'Umzug Mannheim \u00b7 Marlene Direktzug nach Ol\u00e9ron!', prompt: 'Erster Tag in der eigenen Wohnung! Marlene auf Oleron angekommen?' },
        { date: '2026-07-19', label: 'So 19. Jul', loc: 'Mannheim / Ol\u00e9ron', title: 'Wohnung einrichten Tag 2 \u00b7 Marlene Atlantik-Reunion', prompt: 'Wie laeuft das Einrichten? Marlenes Update aus Oleron?' },
        { date: '2026-07-20', label: 'Mo 20. Jul', loc: 'Mannheim / Ol\u00e9ron', title: 'Mannheim \u2013 Tag 3 \u00b7 Marlene Oleron Tag 3', prompt: 'Fortschritte? IKEA-Run? Marlene am Strand?' },
        { date: '2026-07-21', label: 'Di 21. Jul', loc: 'Mannheim / Ol\u00e9ron', title: 'Mannheim \u00b7 Marlene Oleron', prompt: 'Was war heute besonders \u2013 in Mannheim und auf Oleron?' },
        { date: '2026-07-22', label: 'Mi 22. Jul', loc: 'Mannheim / Ol\u00e9ron', title: 'Mannheim \u00b7 Marlene Oleron', prompt: 'Highlights des Tages?' },
        { date: '2026-07-23', label: 'Do 23. Jul', loc: 'Mannheim / Ol\u00e9ron', title: 'Mannheim \u00b7 Marlene Oleron', prompt: 'Was steht heute an?' },
        { date: '2026-07-24', label: 'Fr 24. Jul', loc: 'Mannheim / Ol\u00e9ron', title: 'Mannheim \u00b7 Marlene letzter Oleron-Tag', prompt: 'Wochenrueckblick! Marlenes letzter Tag bei der Gastfamilie?' },
        { date: '2026-07-25', label: 'Sa 25. Jul', loc: 'Mannheim', title: 'Marlene zur\u00fcck! Direktzug Bordeaux\u2192Mannheim', prompt: 'Marlene wieder da! Wie war der Re-Trip? Wie war die Zugfahrt?' },
        { date: '2026-07-26', label: 'So 26. Jul', loc: 'Mannheim', title: 'Mannheim \u2013 letzter Vorbereitungstag', prompt: 'Bereit fuer den 1. Tag bei Fresenius? Aufgeregt?' },
        // 27.07. Carlas 1. Tag bei Fresenius!
        { date: '2026-07-27', label: 'Mo 27. Jul', loc: 'Mannheim \u2192 Bad Homburg', title: '\u2728 Carlas 1. Tag bei Fresenius!', prompt: 'WIE WARS?! Onboarding, erstes Team-Treffen, Eindruck? Erzaehl alles!' },
        // 28.-31.07. Familie verteilt: Carla Fresenius / Luisa Bonn? / Marlene Oleron?
        { date: '2026-07-28', label: 'Di 28. Jul', loc: 'verteilt', title: 'Carla bei Fresenius \u00b7 Luisa & Marlene unterwegs?', prompt: 'Wer ist heute wo? Carla nach Tag 2 bei Fresenius?' },
        { date: '2026-07-29', label: 'Mi 29. Jul', loc: 'verteilt', title: 'Familie verteilt \u2013 jeder macht sein Ding', prompt: 'Updates aus allen Ecken? Wer erlebt was?' },
        { date: '2026-07-30', label: 'Do 30. Jul', loc: 'verteilt', title: 'Familie verteilt \u2013 Tag 3', prompt: 'Highlights heute? Carlas Eindruck nach fast 1 Woche Job?' },
        { date: '2026-07-31', label: 'Fr 31. Jul', loc: 'vor Leipzig', title: 'Vor Leipzig \u2013 alle wieder Richtung Treffpunkt', prompt: 'Wie war Carlas erste Arbeitswoche? Bereit fuer Ellas Geburtstag?' },
        // Phase 6b: Leipzig
        { date: '2026-08-01', label: 'Sa 1. Aug', loc: 'Leipzig', title: 'Leipzig \u2013 Ella wird 4!', prompt: 'Wie war die Geburtstagsparty? Ellas Reaktion?' },
        { date: '2026-08-02', label: 'So 2. Aug', loc: 'Leipzig', title: 'Leipzig \u2013 Tag 2', prompt: 'Was habt ihr in Leipzig unternommen?' },
        { date: '2026-08-03', label: 'Mo 3. Aug', loc: 'Leipzig \u2192 Ingolstadt', title: 'Carla nach Bad Homburg, Rest nach Ingolstadt', prompt: 'Abschied von Carla! Wie geht es weiter?' },
        { date: '2026-08-04', label: 'Di 4. Aug', loc: 'Ingolstadt', title: 'Ingolstadt bei Anett & Robert', prompt: 'Letzter voller Tag! Was macht ihr?' },
        // Phase 7: Rueckfluege
        { date: '2026-08-05', label: 'Mi 5. Aug', loc: 'M\u00fcnchen \u2192 Bangkok', title: 'Marlene & Luisa fliegen zur\u00fcck', prompt: 'Ende eines epischen Sommers! Was war das BESTE Erlebnis der ganzen Reise?' },
    ];

    function setupDiary() {
        if (!window.firebaseReady) {
            window.addEventListener('firebase-ready', () => buildDiary());
        } else {
            buildDiary();
        }
    }

    function buildDiary() {
        days.forEach(day => {
            const dateKey = day.date.replace(/-/g, '');
            const entry = document.createElement('div');
            entry.className = 'diary-entry';
            entry.innerHTML = `
                <div class="diary-header">
                    <span class="diary-date-badge">${day.label}</span>
                    <div class="diary-header-info">
                        <h4>${day.title}</h4>
                        <span class="diary-loc">\uD83D\uDCCD ${day.loc}</span>
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

            // Toggle
            header.addEventListener('click', () => {
                body.style.display = body.style.display === 'none' ? 'block' : 'none';
            });

            // Listen for all diary entries (real-time)
            const diaryRef = window.fbRef(window.fbDb, `diary/${dateKey}`);
            window.fbOnValue(diaryRef, (snapshot) => {
                const entries = snapshot.val() || {};
                const sorted = Object.values(entries).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

                if (sorted.length > 0) {
                    indicator.textContent = `\u270F\uFE0F ${sorted.length} Eintrag${sorted.length > 1 ? 'e' : ''}`;
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

            // Submit entry
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

            container.appendChild(entry);
        });
    }

    setupDiary();
})();

// --- Mobile Nav Toggle ---
const navToggle = document.getElementById('navToggle');
const navLinksEl = document.getElementById('navLinks');

if (navToggle && navLinksEl) {
    navToggle.addEventListener('click', () => {
        navLinksEl.classList.toggle('open');
        navToggle.textContent = navLinksEl.classList.contains('open') ? '\u2715' : '\u2630';
    });

    // Close nav when a link is clicked
    navLinksEl.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinksEl.classList.remove('open');
            navToggle.textContent = '\u2630';
        });
    });
}

// --- Live Weather from Open-Meteo ---
(function() {
    // Trip locations with dates and coordinates
    const locations = [
        { name: 'Bordeaux', lat: 44.8378, lon: -0.5792, from: '2026-06-20', to: '2026-06-21', atlantic: false },
        { name: 'Ile d\'Oleron', lat: 45.9450, lon: -1.3080, from: '2026-06-21', to: '2026-06-30', atlantic: true },
        { name: 'Beaune', lat: 47.0260, lon: 4.8400, from: '2026-06-30', to: '2026-07-01', atlantic: false },
        { name: 'Sindelfingen', lat: 48.7133, lon: 9.0028, from: '2026-07-01', to: '2026-07-03', atlantic: false },
        { name: 'Mannheim', lat: 49.4875, lon: 8.4660, from: '2026-07-03', to: '2026-07-03', atlantic: false },
        { name: 'Bonn', lat: 50.7374, lon: 7.0982, from: '2026-07-03', to: '2026-07-07', atlantic: false },
        { name: 'München', lat: 48.1351, lon: 11.5820, from: '2026-07-10', to: '2026-07-11', atlantic: false },
        { name: 'Passau', lat: 48.5667, lon: 13.4667, from: '2026-07-11', to: '2026-07-16', atlantic: false },
        { name: 'Ingolstadt', lat: 48.7665, lon: 11.4257, from: '2026-07-16', to: '2026-07-17', atlantic: false },
        { name: 'Sindelfingen Abi', lat: 48.7133, lon: 9.0028, from: '2026-07-17', to: '2026-07-18', atlantic: false },
        { name: 'Mannheim Wohnung', lat: 49.4875, lon: 8.4660, from: '2026-07-18', to: '2026-08-01', atlantic: false },
    ];

    const WMO_CODES = {
        0: { icon: '\u2600\uFE0F', text: 'Klar' },
        1: { icon: '\uD83C\uDF24\uFE0F', text: 'Ueberwiegend klar' },
        2: { icon: '\u26C5', text: 'Teilweise bewoelkt' },
        3: { icon: '\u2601\uFE0F', text: 'Bedeckt' },
        45: { icon: '\uD83C\uDF2B\uFE0F', text: 'Nebel' },
        48: { icon: '\uD83C\uDF2B\uFE0F', text: 'Reifnebel' },
        51: { icon: '\uD83C\uDF26\uFE0F', text: 'Leichter Nieselregen' },
        53: { icon: '\uD83C\uDF26\uFE0F', text: 'Nieselregen' },
        55: { icon: '\uD83C\uDF27\uFE0F', text: 'Starker Nieselregen' },
        61: { icon: '\uD83C\uDF27\uFE0F', text: 'Leichter Regen' },
        63: { icon: '\uD83C\uDF27\uFE0F', text: 'Regen' },
        65: { icon: '\uD83C\uDF27\uFE0F', text: 'Starker Regen' },
        71: { icon: '\uD83C\uDF28\uFE0F', text: 'Leichter Schnee' },
        73: { icon: '\uD83C\uDF28\uFE0F', text: 'Schnee' },
        75: { icon: '\uD83C\uDF28\uFE0F', text: 'Starker Schnee' },
        80: { icon: '\uD83C\uDF26\uFE0F', text: 'Leichte Schauer' },
        81: { icon: '\uD83C\uDF27\uFE0F', text: 'Schauer' },
        82: { icon: '\u26C8\uFE0F', text: 'Starke Schauer' },
        95: { icon: '\u26C8\uFE0F', text: 'Gewitter' },
        96: { icon: '\u26C8\uFE0F', text: 'Gewitter mit Hagel' },
        99: { icon: '\u26C8\uFE0F', text: 'Gewitter mit starkem Hagel' },
    };

    const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

    function getCurrentLocation(today) {
        // Find current location, or the next upcoming one (within 7 days)
        const todayMs = today.getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        for (const loc of locations) {
            const from = new Date(loc.from + 'T00:00:00');
            const to = new Date(loc.to + 'T23:59:59');

            // Currently at this location
            if (todayMs >= from.getTime() && todayMs <= to.getTime()) {
                return { current: loc, upcoming: getUpcoming(loc, today) };
            }
        }

        // Not yet on the trip - check if within 7 days of first location
        const firstFrom = new Date(locations[0].from + 'T00:00:00');
        if (todayMs < firstFrom.getTime() && (firstFrom.getTime() - todayMs) <= sevenDays) {
            return { current: locations[0], upcoming: null, preTrip: true };
        }

        return null;
    }

    function getUpcoming(currentLoc, today) {
        const idx = locations.indexOf(currentLoc);
        const todayStr = today.toISOString().slice(0, 10);
        const threeDays = new Date(today);
        threeDays.setDate(threeDays.getDate() + 3);

        // Check if we'll be somewhere else within 3 days
        for (let i = idx + 1; i < locations.length; i++) {
            const from = new Date(locations[i].from + 'T00:00:00');
            if (from <= threeDays) {
                return locations[i];
            }
        }
        return null;
    }

    function isAtlanticPhase(today) {
        const todayMs = today.getTime();
        for (const loc of locations) {
            if (!loc.atlantic) continue;
            const from = new Date(loc.from + 'T00:00:00');
            const to = new Date(loc.to + 'T23:59:59');
            // Show tides also 2 days before arrival
            const earlyFrom = new Date(from);
            earlyFrom.setDate(earlyFrom.getDate() - 2);
            if (todayMs >= earlyFrom.getTime() && todayMs <= to.getTime()) return true;
        }
        return false;
    }

    async function fetchWeather(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset&timezone=auto&forecast_days=3`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Weather API error');
        return resp.json();
    }

    function renderForecast(data, locationName, container) {
        const days = data.daily;
        let html = `
            <div class="live-weather-header">
                <h3>\uD83D\uDCCD ${locationName} &ndash; Live 3-Tage-Vorschau</h3>
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
            const weather = WMO_CODES[code] || { icon: '\u2753', text: 'Unbekannt' };
            const isToday = i === 0 ? ' today' : '';

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
                        <span>\uD83C\uDF27\uFE0F ${days.precipitation_probability_max[i] || 0}% Regen</span>
                        <span>\uD83C\uDF2C\uFE0F ${Math.round(days.wind_speed_10m_max[i])} km/h Wind</span>
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
        const tidesSection = document.getElementById('tidesSection');
        const today = new Date();

        // Show tides if in Atlantic phase
        if (isAtlanticPhase(today)) {
            tidesSection.style.display = 'block';
        }

        const locInfo = getCurrentLocation(today);

        if (!locInfo) {
            container.innerHTML = '<div class="live-weather-loading">Live-Wetter wird ab 7 Tage vor Abreise (ab 13. Juni) angezeigt.</div>';
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
                    : '#8888a0';
            });
        }
    });
});

// --- Countdown Timer ---
(function() {
    const target = new Date('2026-06-20T06:40:00+07:00'); // Abflug BKK
    const el = document.getElementById('countdown');
    if (!el) return;
    function update() {
        const now = new Date();
        const diff = target - now;
        if (diff <= 0) {
            el.innerHTML = '<span style="font-size:1.5rem;color:var(--pink)">LOS GEHT\'S! 🎉</span>';
            return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        el.innerHTML =
            '<div class="countdown-item"><span class="countdown-num">' + d + '</span><span class="countdown-label">Tage</span></div>' +
            '<div class="countdown-item"><span class="countdown-num">' + String(h).padStart(2,'0') + '</span><span class="countdown-label">Std</span></div>' +
            '<div class="countdown-item"><span class="countdown-num">' + String(m).padStart(2,'0') + '</span><span class="countdown-label">Min</span></div>' +
            '<div class="countdown-item"><span class="countdown-num">' + String(s).padStart(2,'0') + '</span><span class="countdown-label">Sek</span></div>';
    }
    update();
    setInterval(update, 1000);
})();

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
        restaurant: '\uD83C\uDF7D\uFE0F', eis: '\uD83C\uDF66', sprit: '\u26FD',
        maut: '\uD83D\uDEE3\uFE0F', supermarkt: '\uD83D\uDED2', aktivitaet: '\uD83C\uDFC4',
        parken: '\uD83C\uDD7F\uFE0F', sonstiges: '\uD83D\uDCB6'
    };
    const CAT_LABELS = {
        restaurant: 'Restaurant', eis: 'Eis', sprit: 'Sprit',
        maut: 'Maut', supermarkt: 'Supermarkt', aktivitaet: 'Aktivität',
        parken: 'Parken', sonstiges: 'Sonstiges'
    };

    // Set default date to today
    const dateInput = document.getElementById('expDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    const submitBtn = document.getElementById('expSubmit');
    if (!submitBtn) return;

    function initExpenses() {
        const expRef = window.fbRef(window.fbDb, 'expenses');

        // Listen for changes
        window.fbOnValue(expRef, (snapshot) => {
            const data = snapshot.val() || {};
            renderExpenses(data);
        });

        // Loeschen per Klick auf das X (Event-Delegation, da die Liste neu gerendert wird)
        const list = document.getElementById('expenseList');
        if (list) {
            list.addEventListener('click', (ev) => {
                const btn = ev.target.closest('.expense-del');
                if (!btn) return;
                const id = btn.dataset.id;
                if (!id) return;
                if (!confirm('Diesen Eintrag wirklich loeschen?')) return;
                window.fbSet(window.fbRef(window.fbDb, 'expenses/' + id), null);
            });
        }

        // Submit handler
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

            // Reset form
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

        // Group by date
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
                html += '<button class="expense-del" data-id="' + e.id + '" title="Eintrag loeschen" aria-label="Eintrag loeschen">&#x2715;</button>';
                html += '</div>';
            });
            html += '</div>';
        });
        list.innerHTML = html;
    }

    // Wait for Firebase
    if (window.firebaseReady) {
        initExpenses();
    } else {
        window.addEventListener('firebase-ready', () => initExpenses());
    }
})();

// --- Phase Toggle (ein-/ausklappen, Standard: zugeklappt) ---
document.querySelectorAll('.phase-label').forEach((label, i) => {
    // Text in span wrappen fuer Gradient
    const text = label.textContent;
    label.innerHTML = '<span>' + text + '</span>';

    // Sammle alle Geschwister-Elemente bis zum naechsten phase-label
    const content = [];
    let sibling = label.nextElementSibling;
    while (sibling && !sibling.classList.contains('phase-label')) {
        content.push(sibling);
        sibling = sibling.nextElementSibling;
    }
    // Wrapper erstellen
    const wrapper = document.createElement('div');
    wrapper.classList.add('phase-content');
    label.parentNode.insertBefore(wrapper, content[0]);
    content.forEach(el => wrapper.appendChild(el));

    // Hinweis unter dem ersten Label
    if (i === 0) {
        const hint = document.createElement('div');
        hint.classList.add('phase-hint');
        hint.textContent = 'Klick auf einen Termin um Details aufzuklappen';
        label.parentNode.insertBefore(hint, wrapper);
    }

    // Warnungs-Phasen sofort aufgeklappt anzeigen
    if (label.classList.contains('phase-label-warning')) {
        label.classList.add('expanded');
        wrapper.classList.add('expanded');
    }

    // Klick-Handler
    label.addEventListener('click', () => {
        label.classList.toggle('expanded');
        wrapper.classList.toggle('expanded');
    });
});
