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

// --- Side Quests & Rangliste (Firebase - geteilt, pro Person) ---
// Jede Quest hat XP. Tippt jemand bei einer Quest auf seinen Namen, wird sie fuer
// diese Person als erledigt markiert und die XP gehen an sie. Die Rangliste
// errechnet sich automatisch aus allen erledigten Quests (live fuer alle).
(function() {
    const grid = document.getElementById('questGrid');
    const lbList = document.getElementById('leaderboardList');
    if (!grid || !lbList) return;

    // Quests passend zum Reiseverlauf 2026 (Oleron -> Roadtrip -> Deutschland)
    const QUESTS = [
        { id: 'eis',         emoji: '🍦', diff: 'easy',   xp: 10,
          title: 'Eis-Degustation',
          desc: 'Probiert in jeder Stadt eine Eisdiele und bewertet von 1&ndash;10. Wer findet das beste Eis des Sommers?' },
        { id: 'austern',     emoji: '🦪', diff: 'medium', xp: 60,
          title: 'Austern-Mutprobe',
          desc: 'Eine frische Auster direkt von Oleron schluerfen &ndash; roh und mutig! Wer traut sich?' },
        { id: 'surf',        emoji: '🏄', diff: 'medium', xp: 50,
          title: 'Surf Champion',
          desc: 'Wer steht beim Surfkurs in Vert Bois am laengsten auf dem Board?' },
        { id: 'tourdeoleron',emoji: '🚴', diff: 'hard',   xp: 200,
          title: 'Tour de Oleron',
          desc: 'Die Insel komplett per Fahrrad umrunden (~65 km). Respekt fuer alle, die es schaffen!' },
        { id: 'golden',      emoji: '📸', diff: 'easy',   xp: 30,
          title: 'Golden Hour Challenge',
          desc: 'Jeden Abend ein Sonnenuntergangs-Foto. Am Ende wird abgestimmt &ndash; das beste Foto gewinnt!' },
        { id: 'atlantik',    emoji: '🌊', diff: 'medium', xp: 40,
          title: 'Atlantik-Sprung',
          desc: 'Einmal komplett im Atlantik untertauchen &ndash; egal wie kalt das Wasser ist!' },
        { id: 'kaese',       emoji: '🧀', diff: 'hard',   xp: 100,
          title: 'Kaese-Connoisseur',
          desc: 'Probiert 10 verschiedene franzoesische Kaesesorten und merkt euch die Namen. Quiz am Ende!' },
        { id: 'francais',    emoji: '🗣️', diff: 'medium', xp: 75,
          title: 'Parlez-vous francais?',
          desc: 'Bestellt einmal komplett auf Franzoesisch im Restaurant. Bonus: ohne dass der Kellner auf Englisch wechselt!' },
        { id: 'langustinen', emoji: '🦐', diff: 'medium', xp: 50,
          title: 'Langustinen-Wettessen',
          desc: 'Bei der Langoustinade die meisten Langustinen vernichten. Wer schafft am meisten?' },
        { id: 'sonnenstreak',emoji: '🌅', diff: 'easy',   xp: 30,
          title: 'Sonnenuntergangs-Streak',
          desc: '5 Tage in Folge den Sonnenuntergang live sehen &ndash; ohne Handy waehrenddessen!' },
        { id: 'cabanes',     emoji: '🎨', diff: 'medium', xp: 50,
          title: 'Regenbogen-Cabanes',
          desc: 'Die bunten Fischerhuetten von La Cotiniere: fotografiert eine in jeder Farbe &ndash; rot, blau, gruen, gelb.' },
        { id: 'geheimstrand',emoji: '🏖️', diff: 'medium', xp: 40,
          title: 'Geheimer Strand',
          desc: 'Entdeckt eine Bucht, die nicht auf der Touri-Karte steht und wo kaum jemand ist.' },
        { id: 'leuchtturm',  emoji: '🗼', diff: 'medium', xp: 50,
          title: '224 Stufen',
          desc: 'Den Leuchtturm Phare de Chassiron hochsteigen, die Stufen zaehlen und oben den Ausblick geniessen.' },
        { id: 'postkarte',   emoji: '✉️', diff: 'easy',   xp: 30,
          title: 'Postkarten-Mission',
          desc: 'Eine Postkarte kaufen, auf Franzoesisch beschriften und in einen echten franzoesischen Briefkasten werfen.' },
        { id: 'kapitaen',    emoji: '🧭', diff: 'medium', xp: 50,
          title: 'Tages-Kapitaen',
          desc: 'Einen ganzen Tag die Crew anfuehren: Route, Restaurant, Plan &ndash; alle ziehen mit, kein Meckern erlaubt!' },
        { id: 'handyfrei',   emoji: '📵', diff: 'easy',   xp: 30,
          title: 'Handy-freies Dinner',
          desc: 'Ein komplettes Abendessen, bei dem niemand das Handy anfasst. Wer zuerst zueckt, verliert.' },
        { id: 'sonnenaufgang',emoji: '🌅', diff: 'medium', xp: 40,
          title: 'Frueher Vogel',
          desc: 'Einen Sonnenaufgang schaffen (schwerer als der Sonnenuntergang!) &ndash; einmal reicht.' },
        { id: 'muscheln',    emoji: '🐚', diff: 'medium', xp: 40,
          title: 'Muschel-Bestimmer',
          desc: '5 verschiedene Muscheln am Strand sammeln und herausfinden, wie sie heissen.' },
        { id: 'naturspaziergang', emoji: '🌿', diff: 'medium', xp: 40,
          title: 'Natur-Spaziergang',
          desc: 'Eine Stunde raus in die Natur &ndash; und das Handy bleibt zu Hause!' },
        { id: 'familiendinner',   emoji: '🍳', diff: 'medium', xp: 60,
          title: 'Familien-Dinner',
          desc: 'Ein ganzes Abendessen ganz allein fuer die Familie kochen.' },
        { id: 'fruehstueck',      emoji: '🥐', diff: 'easy',   xp: 30,
          title: 'Fruehstuecksheld',
          desc: 'Frueh aufstehen, zum Baecker und Fruehstueck fuer die ganze Familie holen.' },
        { id: 'picknick',         emoji: '🧺', diff: 'medium', xp: 40,
          title: 'Picknick-Planer',
          desc: 'Ein Picknick fuer die Familie vorbereiten und alles einpacken.' },
        { id: 'tierspotter',      emoji: '🦀', diff: 'easy',   xp: 30,
          title: 'Tier-Spotter',
          desc: 'Ein wildes Tier entdecken (Krebs, Vogel, Hase) und in Ruhe beobachten.' },
        { id: 'abwasch',          emoji: '🍽️', diff: 'medium', xp: 40,
          title: 'Abwasch-Held',
          desc: 'Einen ganzen Tag ungefragt Tisch decken und abraeumen.' },
        { id: 'morgenservice',    emoji: '☕', diff: 'easy',   xp: 30,
          title: 'Morgen-Service',
          desc: 'Allen morgens einen Kaffee oder Tee ans Bett bringen.' },
        { id: 'dankesnachricht',  emoji: '💌', diff: 'easy',   xp: 30,
          title: 'Dankes-Nachricht',
          desc: 'Jemandem aus der Familie etwas Liebes schreiben.' },
        { id: 'einkaufsheld',     emoji: '🛒', diff: 'medium', xp: 40,
          title: 'Einkaufs-Held',
          desc: 'Ganz allein den Einkauf fuer die Familie erledigen.' },
        { id: 'aufraeumfee',      emoji: '🧹', diff: 'medium', xp: 40,
          title: 'Aufraeum-Fee',
          desc: 'Das Ferienhaus oder das Auto ungefragt aufraeumen.' },
        { id: 'meerauszeit',      emoji: '🌊', diff: 'easy',   xp: 30,
          title: 'Meer-Auszeit',
          desc: '10 Minuten ans Wasser setzen, nur lauschen &ndash; Handy bleibt weg.' },
        { id: 'vogellauscher',    emoji: '🐦', diff: 'easy',   xp: 30,
          title: 'Vogel-Lauscher',
          desc: 'Frueh den Voegeln zuhoeren und die Stimmen unterscheiden.' },
        { id: 'blumenbote',       emoji: '🌻', diff: 'easy',   xp: 30,
          title: 'Blumen-Bote',
          desc: 'Einen Wildblumenstrauss fuer den Esstisch pfluecken.' },
        { id: 'lesestunde',       emoji: '📖', diff: 'medium', xp: 50,
          title: 'Lese-Stunde',
          desc: 'Eine Stunde draussen lesen statt aufs Handy zu schauen.' },
        { id: 'gutetat',          emoji: '🤝', diff: 'medium', xp: 40,
          title: 'Gute-Tat',
          desc: 'Einem Fremden helfen &ndash; Weg zeigen, etwas tragen, Tuer aufhalten.' },
        { id: 'lasttier',         emoji: '🛍️', diff: 'medium', xp: 50,
          title: 'Lasttier',
          desc: 'Am meisten zum Strand schleppen &ndash; Taschen, Schirm, Kuehlbox!' },
        { id: 'moewenpaparazzo',  emoji: '🦅', diff: 'easy',   xp: 30,
          title: 'Moewen-Paparazzo',
          desc: 'Eine richtig grosse Moewe aus der Naehe fotografieren.' },
        { id: 'eisretter',        emoji: '🍦', diff: 'easy',   xp: 20,
          title: 'Eis-Retter',
          desc: 'Ein Eis komplett aufessen, bevor es schmilzt!' },
        { id: 'steinflitscher',   emoji: '🪨', diff: 'easy',   xp: 30,
          title: 'Stein-Flitscher',
          desc: 'Einen flachen Stein am Wasser so oft wie moeglich huepfen lassen.' },
        { id: 'sprungfoto',       emoji: '📸', diff: 'easy',   xp: 30,
          title: 'Sprungfoto',
          desc: 'Ein perfektes Sprungfoto am Strand hinkriegen &ndash; alle in der Luft!' },
        { id: 'mutsprung',        emoji: '🧊', diff: 'easy',   xp: 30,
          title: 'Mutigster Sprung',
          desc: 'Als Erste:r in den kalten Atlantik springen.' },
        { id: 'eisbaer',          emoji: '🌊', diff: 'medium', xp: 40,
          title: 'Eisbaer',
          desc: 'Am laengsten im kalten Wasser bleiben &ndash; wer haelt durch?' },
        { id: 'baguette',         emoji: '🥖', diff: 'easy',   xp: 20,
          title: 'Baguette-Balance',
          desc: 'Ein Baguette den ganzen Weg heimtragen, ohne reinzubeissen!' },
        { id: 'strandstyle',      emoji: '😎', diff: 'easy',   xp: 20,
          title: 'Strand-Style',
          desc: 'Den coolsten Strand-Look des Tages tragen &ndash; Sonnenbrille, Hut, alles.' },
        { id: 'wellenrenner',     emoji: '🌊', diff: 'easy',   xp: 20,
          title: 'Wellen-Renner',
          desc: 'Vor einer auslaufenden Welle wegrennen, ohne nass zu werden!' },
        { id: 'sandengel',        emoji: '👼', diff: 'easy',   xp: 20,
          title: 'Sand-Engel',
          desc: 'Einen Sandengel in den Strand druecken &ndash; wie ein Schneeengel, nur warm.' },
        { id: 'wattlaeufer',      emoji: '🦀', diff: 'medium', xp: 30,
          title: 'Wattlaeufer',
          desc: 'Bei Ebbe ueber das freigelegte Watt laufen und schauen, was zum Vorschein kommt.' },
        { id: 'salzfrisur',       emoji: '🧜', diff: 'easy',   xp: 20,
          title: 'Salzwasser-Frisur',
          desc: 'Mit nassen Atlantik-Haaren den ganzen Tag verbringen &ndash; echte Beach-Hair!' },
        { id: 'sandkuenstler',    emoji: '✏️', diff: 'easy',   xp: 20,
          title: 'Sand-Kuenstler',
          desc: 'Etwas Grosses in den nassen Sand malen oder schreiben.' },
        { id: 'wolkengucker',     emoji: '☁️', diff: 'easy',   xp: 20,
          title: 'Wolken-Gucker',
          desc: 'Im Sand liegen und Formen in den Wolken entdecken.' },
        { id: 'lieblingsplatz',   emoji: '🌿', diff: 'medium', xp: 30,
          title: 'Lieblingsplatz',
          desc: 'Einen ruhigen Lieblingsplatz finden und 15 Minuten einfach nur geniessen.' },
        { id: 'kompliment',       emoji: '🤗', diff: 'medium', xp: 30,
          title: 'Komplimente-Tag',
          desc: 'Jedem in der Familie heute ein ehrliches Kompliment machen.' },
        { id: 'sonnencreme',      emoji: '🧴', diff: 'easy',   xp: 20,
          title: 'Sonnencreme-Engel',
          desc: 'Allen den Ruecken eincremen, bevor es an den Strand geht.' },
        { id: 'strandpacker',     emoji: '🎒', diff: 'medium', xp: 30,
          title: 'Strand-Packer',
          desc: 'Die Strandtasche fuer alle vorbereiten &ndash; Wasser, Snacks, Tuecher.' },
        { id: 'familienselfie',   emoji: '🤳', diff: 'easy',   xp: 20,
          title: 'Familien-Selfie',
          desc: 'Ein Selfie mit der ganzen Crew schiessen &ndash; alle muessen drauf!' },
        { id: 'painchocolat',     emoji: '🍫', diff: 'easy',   xp: 20,
          title: 'Pain au Chocolat',
          desc: 'Ein warmes Pain au Chocolat vom Baecker geniessen &ndash; echt franzoesisch.' },
        { id: 'grimassen',        emoji: '🤪', diff: 'easy',   xp: 20,
          title: 'Grimassen-Koenig',
          desc: 'Das allerlustigste Foto-Gesicht der Familie ziehen.' },
        { id: 'strandtanz',       emoji: '🕺', diff: 'easy',   xp: 20,
          title: 'Strand-Tanz',
          desc: 'Einen total albernen Tanz am Strand auffuehren &ndash; ohne rot zu werden!' },
        { id: 'akzent',           emoji: '🗣️', diff: 'medium', xp: 30,
          title: 'Akzent-Tag',
          desc: 'Einen ganzen Tag mit uebertrieben franzoesischem Akzent reden.' },
        { id: 'robbe',            emoji: '🦭', diff: 'easy',   xp: 20,
          title: 'Robben-Robbe',
          desc: 'Sich wie eine Robbe ueber den Sand robben &ndash; Gerausch inklusive!' },
        { id: 'moeweimitator',    emoji: '🐔', diff: 'easy',   xp: 20,
          title: 'Moewen-Imitator',
          desc: 'Eine Moewe perfekt nachmachen &ndash; Schrei und Watscheln.' },
        { id: 'lachverbot',       emoji: '😬', diff: 'medium', xp: 30,
          title: 'Lach-Verbot',
          desc: '1 Minute jemandem gegenuebersitzen, ohne zu lachen. Wer zuerst grinst, verliert!' },
        { id: 'autokaraoke',      emoji: '🎤', diff: 'easy',   xp: 20,
          title: 'Auto-Karaoke',
          desc: 'Im Auto ein Lied lauthals mitschmettern &ndash; alle muessen mitsingen.' },
        { id: 'witze',            emoji: '🤡', diff: 'easy',   xp: 20,
          title: 'Witze-Erzaehler',
          desc: 'Die ganze Familie mit einem Witz zum Lachen bringen.' },
        { id: 'pinguin',          emoji: '🐧', diff: 'easy',   xp: 20,
          title: 'Pinguin-Gang',
          desc: 'Wie ein Pinguin den ganzen Strand entlang watscheln.' },
        { id: 'photobomb',        emoji: '📸', diff: 'easy',   xp: 20,
          title: 'Photobomb-Koenig',
          desc: 'Heimlich ein Familienfoto sprengen, ohne dass es jemand merkt.' },
        { id: 'chefkochtag',      emoji: '🍽️', diff: 'hard',   xp: 100,
          title: 'Chefkoch-Tag',
          desc: 'Einen ganzen Tag fuer die Familie kochen &ndash; Fruehstueck, Mittag und Abendessen!' },
        { id: 'wanderheld',       emoji: '🚶', diff: 'hard',   xp: 100,
          title: 'Wander-Held',
          desc: 'Eine lange Kuestenwanderung (10+ km) am Stueck schaffen.' },
        { id: 'handyfreitag',     emoji: '📵', diff: 'hard',   xp: 100,
          title: 'Handy-freier Tag',
          desc: 'Einen ganzen Tag komplett ohne Handy verbringen &ndash; von morgens bis abends.' },
        { id: 'buchverschlinger', emoji: '📖', diff: 'hard',   xp: 100,
          title: 'Buch-Verschlinger',
          desc: 'Ein ganzes Buch im Urlaub von vorne bis hinten durchlesen.' },
        { id: 'badestreak',       emoji: '🌊', diff: 'hard',   xp: 90,
          title: 'Bade-Streak',
          desc: 'An 7 Tagen in Folge im Atlantik baden &ndash; egal bei welchem Wetter!' },
        { id: 'ueberraschung',    emoji: '🎁', diff: 'medium', xp: 80,
          title: 'Ueberraschungs-Tag',
          desc: 'Jemandem aus der Familie einen kompletten Ueberraschungstag organisieren.' },
        { id: 'sonnendoppel',     emoji: '🌅', diff: 'medium', xp: 80,
          title: 'Sonnen-Doppel',
          desc: 'Sonnenaufgang UND Sonnenuntergang am selben Tag live erleben.' },
        { id: 'helferwoche',      emoji: '🤝', diff: 'hard',   xp: 120,
          title: 'Helfer-Woche',
          desc: 'Eine ganze Woche lang jeden Tag ungefragt im Haushalt mithelfen.' },
        { id: 'urlaubsalbum',     emoji: '🎨', diff: 'hard',   xp: 90,
          title: 'Urlaubs-Album',
          desc: 'Die schoensten Fotos des Urlaubs zu einem Album oder einer Collage zusammenstellen.' },
        { id: 'schatzsuche',      emoji: '🗺️', diff: 'hard',   xp: 90,
          title: 'Schatzsuche',
          desc: 'Eine eigene Schatzsuche fuer die Familie ausdenken, verstecken und durchfuehren.' },
        { id: 'familienfilm',     emoji: '🎬', diff: 'hard',   xp: 100,
          title: 'Familien-Film',
          desc: 'Einen kurzen Urlaubs-Film drehen und zu einem coolen Video zusammenschneiden.' },
        { id: 'sunsetdinner',     emoji: '🏕️', diff: 'hard',   xp: 90,
          title: 'Sonnenuntergangs-Dinner',
          desc: 'Ein komplettes Abendessen am Strand bei Sonnenuntergang organisieren.' },
        { id: 'schnorchel',       emoji: '🤿', diff: 'medium', xp: 80,
          title: 'Schnorchel-Safari',
          desc: 'Mit Schnorchel und Taucherbrille Fische und Krebse unter Wasser entdecken.' },
        { id: 'wassertour',       emoji: '🚣', diff: 'hard',   xp: 90,
          title: 'Wasser-Tour',
          desc: 'Eine Kajak- oder SUP-Tour aufs Meer machen &ndash; raus aufs Wasser!' },
        { id: 'fotochallenge',    emoji: '📸', diff: 'medium', xp: 80,
          title: 'Foto-Challenge',
          desc: 'An einem Tag 10 kreative Fotos zu ganz verschiedenen Themen schiessen.' },
        { id: 'muschelkunst',     emoji: '🎨', diff: 'medium', xp: 80,
          title: 'Muschel-Kunstwerk',
          desc: 'Aus gesammelten Muscheln und Steinen ein kleines Kunstwerk basteln.' },
    ];

    // Quests bunt durchmischen: alte & neue verteilt, aber stabile Reihenfolge
    // (gleich bei jedem Laden, damit die Karten nicht herumspringen).
    function questHash(s) {
        let h = 0;
        for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
        return h;
    }
    QUESTS.sort((a, b) => questHash(a.id) - questHash(b.id));

    const DIFF_LABEL = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' };
    const MEDALS = ['🥇', '🥈', '🥉'];

    // Quest-Karten aufbauen (mit Namens-Buttons statt Checkbox)
    grid.innerHTML = QUESTS.map(q => `
        <div class="quest-card" data-quest="${q.id}">
            <div class="quest-difficulty ${q.diff}">${DIFF_LABEL[q.diff]}</div>
            <h3>${q.emoji} ${q.title}</h3>
            <p>${q.desc}</p>
            <div class="quest-reward">+${q.xp} XP pro Person</div>
            <div class="quest-members">
                ${MEMBERS.map(m => `
                    <button class="quest-member" type="button" data-quest="${q.id}" data-member="${m}" title="${m} hat&rsquo;s geschafft">
                        <span class="qm-icon">${MEMBER_ICONS[m]}</span>
                        <span class="qm-name">${m}</span>
                    </button>`).join('')}
            </div>
        </div>`).join('');

    let questData = {}; // { questId: { member: true } }

    function isDone(questId, member) {
        return !!(questData[questId] && questData[questId][member]);
    }

    function renderQuestStates() {
        grid.querySelectorAll('.quest-member').forEach(btn => {
            btn.classList.toggle('done', isDone(btn.dataset.quest, btn.dataset.member));
        });
    }

    function renderLeaderboard() {
        const totals = MEMBERS.map(m => {
            let xp = 0, count = 0;
            QUESTS.forEach(q => { if (isDone(q.id, m)) { xp += q.xp; count++; } });
            return { name: m, xp, count };
        });
        totals.sort((a, b) => b.xp - a.xp || b.count - a.count || a.name.localeCompare(b.name));
        const maxXp = Math.max(totals[0].xp, 1);

        lbList.innerHTML = totals.map((t, i) => {
            const pct = Math.min((t.xp / maxXp) * 100, 100);
            const rank = (t.xp > 0 && i < 3)
                ? `<span class="lb-medal">${MEDALS[i]}</span>`
                : `<span class="lb-num">${i + 1}</span>`;
            const leader = (i === 0 && t.xp > 0) ? ' leader' : '';
            return `
                <div class="lb-row${leader}">
                    <span class="lb-rank">${rank}</span>
                    <span class="lb-name">${MEMBER_ICONS[t.name]} ${t.name}</span>
                    <div class="lb-bar"><div class="lb-fill" style="width:${pct}%"></div></div>
                    <span class="lb-xp">${t.xp} XP <span class="lb-count">&middot; ${t.count}</span></span>
                </div>`;
        }).join('');
    }

    function renderAll() {
        renderQuestStates();
        renderLeaderboard();
    }

    function setup() {
        const qRef = window.fbRef(window.fbDb, 'quests');
        window.fbOnValue(qRef, (snapshot) => {
            questData = snapshot.val() || {};
            renderAll();
        });

        grid.addEventListener('click', (ev) => {
            const btn = ev.target.closest('.quest-member');
            if (!btn) return;
            const quest = btn.dataset.quest;
            const member = btn.dataset.member;
            const next = isDone(quest, member) ? null : true;
            window.fbSet(window.fbRef(window.fbDb, `quests/${quest}/${member}`), next);
        });
    }

    renderAll(); // sofortige Anzeige (leer), bevor Firebase laedt
    if (window.firebaseReady) {
        setup();
    } else {
        window.addEventListener('firebase-ready', setup);
    }
})();

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
        parken: '\uD83C\uDD7F\uFE0F', taxi: '\uD83D\uDE95', bahn: '\uD83D\uDE86', baeckerei: '\uD83E\uDD50', cafe: '\u2615',
        farmermarkt: '\uD83E\uDDFA', souvenir: '\uD83C\uDF81', sonstiges: '\uD83D\uDCB6'
    };
    const CAT_LABELS = {
        restaurant: 'Restaurant', eis: 'Eis', sprit: 'Sprit',
        maut: 'Maut', supermarkt: 'Supermarkt', aktivitaet: 'Aktivität',
        parken: 'Parken', taxi: 'Taxi', bahn: 'Deutsche Bahn', baeckerei: 'Bäckerei', cafe: 'Café',
        farmermarkt: 'Farmer\'s Markt', souvenir: 'Souvenirs', sonstiges: 'Sonstiges'
    };

    // Set default date to today
    const dateInput = document.getElementById('expDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    const submitBtn = document.getElementById('expSubmit');
    if (!submitBtn) return;

    // Bearbeitungs-Status: welche Eintrags-id wird gerade bearbeitet (null = neuer Eintrag)
    let editingId = null;
    let editingTs = null;
    let lastData = {};

    function exitEditMode() {
        editingId = null;
        editingTs = null;
        document.getElementById('expCat').value = '';
        document.getElementById('expAmount').value = '';
        document.getElementById('expDesc').value = '';
        document.getElementById('expDate').valueAsDate = new Date();
        submitBtn.textContent = 'Eintragen';
        if (cancelBtn) cancelBtn.style.display = 'none';
    }

    // Abbrechen-Button (nur im Bearbeiten-Modus sichtbar)
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'expense-btn expense-btn-cancel';
    cancelBtn.textContent = 'Abbrechen';
    cancelBtn.style.display = 'none';
    submitBtn.parentNode.appendChild(cancelBtn);
    cancelBtn.addEventListener('click', exitEditMode);

    function initExpenses() {
        const expRef = window.fbRef(window.fbDb, 'expenses');

        // Listen for changes
        window.fbOnValue(expRef, (snapshot) => {
            const data = snapshot.val() || {};
            renderExpenses(data);
        });

        // Loeschen & Bearbeiten per Klick (Event-Delegation, da die Liste neu gerendert wird)
        const list = document.getElementById('expenseList');
        if (list) {
            list.addEventListener('click', (ev) => {
                const delBtn = ev.target.closest('.expense-del');
                if (delBtn) {
                    const id = delBtn.dataset.id;
                    if (!id) return;
                    if (!confirm('Diesen Eintrag wirklich loeschen?')) return;
                    if (id === editingId) exitEditMode();
                    window.fbSet(window.fbRef(window.fbDb, 'expenses/' + id), null);
                    return;
                }

                const editBtn = ev.target.closest('.expense-edit');
                if (editBtn) {
                    const id = editBtn.dataset.id;
                    if (!id || !lastData[id]) return;
                    const e = lastData[id];
                    editingId = id;
                    editingTs = e.ts || null;
                    document.getElementById('expCat').value = e.cat || '';
                    document.getElementById('expAmount').value = e.amount != null ? e.amount : '';
                    document.getElementById('expDesc').value = e.desc || '';
                    if (e.date) document.getElementById('expDate').value = e.date;
                    submitBtn.textContent = 'Aktualisieren';
                    cancelBtn.style.display = '';
                    document.getElementById('expenseForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
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
                const restore = editingId ? 'Aktualisieren' : 'Eintragen';
                setTimeout(() => { submitBtn.textContent = restore; }, 2000);
                return;
            }

            if (editingId) {
                // Bestehenden Eintrag ueberschreiben (gleiche id, urspruengliches ts behalten)
                window.fbSet(window.fbRef(window.fbDb, 'expenses/' + editingId), {
                    cat: cat,
                    amount: amount,
                    desc: desc,
                    date: date,
                    ts: editingTs || Date.now()
                });
                exitEditMode();
                submitBtn.textContent = 'Aktualisiert!';
                setTimeout(() => { submitBtn.textContent = 'Eintragen'; }, 1500);
            } else {
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
            }
        });
    }

    function renderExpenses(data) {
        lastData = data || {};
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
                html += '<button class="expense-edit" data-id="' + e.id + '" title="Eintrag bearbeiten" aria-label="Eintrag bearbeiten">&#x270F;&#xFE0F;</button>';
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
