var AC = window.AudioContext || window.webkitAudioContext, ctx = null;
var musicOn = true, muted = false, arpInt = null, arpIdx = 0, loveSongInt = null;
var arpNotes = [261, 293, 329, 392, 440, 392, 329, 293];

function initAudio() { if (!ctx) ctx = new AC(); if (ctx.state === 'suspended') ctx.resume(); }
function note(freq, type, vol, dur, delay) {
    if (muted || !ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type || 'sine'; o.frequency.value = freq;
    var t = ctx.currentTime + (delay || 0);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur);
}
function playChime(combo) {
    var m = combo > 4 ? 2 : combo > 2 ? 1.5 : 1;
    [523, 659, 784, 1047].forEach(function (f, i) { note(f * m, 'sine', 0.14, 0.28, i * 0.06); });
}
function playBuzz() { note(85, 'sawtooth', 0.08, 0.2); note(65, 'square', 0.05, 0.12, 0.06); }
function playFanfare() { [523, 659, 784, 1047, 1319, 1047, 1319, 1568].forEach(function (f, i) { note(f, 'triangle', 0.18, 0.22, i * 0.11); }); }
function playLevelUp() { note(440, 'sine', 0.1, 0.1); note(554, 'sine', 0.1, 0.12, 0.14); note(659, 'sine', 0.13, 0.22, 0.28); }
function playWarning() { note(220, 'sawtooth', 0.06, 0.08); note(196, 'sawtooth', 0.06, 0.08, 0.12); }
function startArp() {
    if (!musicOn || muted || !ctx) return;
    arpInt = setInterval(function () {
        if (muted || !musicOn) return;
        note(arpNotes[arpIdx % arpNotes.length], 'sine', 0.048, 0.36); arpIdx++;
    }, 380);
}
function stopArp() { clearInterval(arpInt); }
function playLoveSong() {
    if (!ctx) return; stopLoveSong();
    var mel = [392, 440, 494, 523, 523, 494, 440, 392, 349, 392, 440, 494, 440, 392, 349, 330, 330, 349, 392, 440, 392, 349, 330, 294, 294, 330, 349, 392, 349, 330, 294, 330];
    var bass = [196, 165, 174, 196, 174, 165, 147, 165];
    var step = 0, bs = 0, bpm = 415;
    loveSongInt = setInterval(function () {
        if (muted) return;
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.value = mel[step % mel.length];
        var t = ctx.currentTime;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.13, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (bpm / 1000) * 0.87);
        o.start(t); o.stop(t + (bpm / 1000));
        if (step % 4 === 0) {
            var bo = ctx.createOscillator(), bg = ctx.createGain();
            bo.connect(bg); bg.connect(ctx.destination);
            bo.type = 'triangle'; bo.frequency.value = bass[bs % bass.length];
            bg.gain.setValueAtTime(0, t); bg.gain.linearRampToValueAtTime(0.07, t + 0.06);
            bg.gain.exponentialRampToValueAtTime(0.0001, t + (bpm / 1000) * 3.7);
            bo.start(t); bo.stop(t + (bpm / 1000) * 4); bs++;
        }
        step++;
    }, bpm);
}
function stopLoveSong() { clearInterval(loveSongInt); }
function toggleMute() { muted = !muted; document.getElementById('mute-btn').textContent = muted ? '🔇' : '🔊'; }
function toggleMusicPref() {
    musicOn = !musicOn;
    document.getElementById('music-toggle').textContent = '🎵 Music: ' + (musicOn ? 'ON' : 'OFF');
    if (!musicOn) stopArp(); else if (gameOn) startArp();
}

// DIFFICULTY CONFIG
var DIFF = {
    easy: {
        label: '😊 Easy', color: '#86efac', bc: 'rgba(100,220,130,0.13)', bb: 'rgba(100,220,130,0.38)',
        badChance: 0.13, badMax: 0.22, spawnMs: 950, spawnMin: 700,
        spdBase: 2.0, spdMax: 4.2, time: 70, target: 30, baskW: 90, zigzag: false, fake: false, blind: false
    },
    medium: {
        label: '🔥 Medium', color: '#fcd34d', bc: 'rgba(255,180,80,0.13)', bb: 'rgba(255,180,80,0.38)',
        badChance: 0.22, badMax: 0.38, spawnMs: 760, spawnMin: 460,
        spdBase: 2.8, spdMax: 6.0, time: 60, target: 30, baskW: 76, zigzag: true, fake: false, blind: false
    },
    hard: {
        label: '💀 Hard', color: '#fca5a5', bc: 'rgba(255,80,100,0.13)', bb: 'rgba(255,80,100,0.38)',
        badChance: 0.30, badMax: 0.50, spawnMs: 580, spawnMin: 300,
        spdBase: 3.5, spdMax: 8.5, time: 50, target: 30, baskW: 62, zigzag: true, fake: true, blind: true
    }
};
var selDiff = 'easy', D = DIFF.easy;
function selectDiff(d) {
    selDiff = d; D = DIFF[d];
    ['easy', 'medium', 'hard'].forEach(function (x) { document.getElementById('btn-' + x).classList.remove('selected'); });
    document.getElementById('btn-' + d).classList.add('selected');
}

// CANVAS
var bgC = document.getElementById('bg-canvas'), bgX = bgC.getContext('2d');
var gc = document.getElementById('game-canvas'), gx = gc.getContext('2d');
var W = 420, H = 580;
bgC.width = gc.width = W; bgC.height = gc.height = H;

// STATE
var sc = 0, pts = 0, ms = 0, tl = 0, gameOn = false, level = 1, combo = 0, maxCombo = 0;
var tInt = null, spInt = null, diffInt = null;
var basketX = W / 2, basketTargetX = W / 2, basketY = H - 54, basketW = 88;
var hearts = [], particles = [], ripples = [], bgStars = [];
var curSpawnMs = 900, curBad = 0.15, curSpd = 2.2;
var blindAlpha = 0, blindActive = false, warnShown = false;

for (var i = 0; i < 70; i++) {
    bgStars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.2, a: Math.random(), da: 0.003 + Math.random() * 0.009 });
}
var goodEm = ['💗', '💓', '💕', '💖', '💝', '💞', '❤️', '🌸'];
var fakeEm = ['💗', '💓'];

function spawnHeart() {
    if (!gameOn) return;
    var bad = Math.random() < curBad;
    var fake = false;
    if (!bad && D.fake && Math.random() < 0.12) { bad = true; fake = true; }
    var em = fake ? fakeEm[Math.floor(Math.random() * fakeEm.length)] : bad ? '💔' : goodEm[Math.floor(Math.random() * goodEm.length)];
    hearts.push({
        x: 36 + Math.random() * (W - 72), y: -40,
        vy: curSpd + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.5,
        em: em, bad: bad, fake: fake,
        scale: 1, targetScale: 1, alpha: 1,
        caught: false, dead: false,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.032 + Math.random() * 0.027,
        size: 27 + Math.floor(Math.random() * 13),
        zigPhase: Math.random() * Math.PI * 2
    });
}

function startDiffRamp() {
    clearInterval(diffInt);
    diffInt = setInterval(function () {
        if (!gameOn) return;
        var prog = Math.max(0, 1 - (tl / D.time));
        curSpd = D.spdBase + (D.spdMax - D.spdBase) * prog * 0.75;
        curBad = D.badChance + (D.badMax - D.badChance) * prog;
        var nMs = Math.round(D.spawnMs - (D.spawnMs - D.spawnMin) * prog * 0.8);
        if (Math.abs(nMs - curSpawnMs) > 55) {
            curSpawnMs = nMs;
            clearInterval(spInt);
            spInt = setInterval(function () {
                spawnHeart();
                if (level >= 2) spawnHeart();
                if (level >= 4 && Math.random() < 0.5) spawnHeart();
            }, curSpawnMs);
        }
        if (D.blind && tl <= 14 && tl > 0 && !blindActive) { triggerBlind(); }
    }, 1800);
}

function triggerBlind() {
    blindActive = true; playWarning();
    var sw = document.getElementById('speed-warn');
    sw.textContent = '🌑 Darkness!'; sw.style.opacity = '1';
    setTimeout(function () { blindActive = false; sw.style.opacity = '0'; }, 2000);
}

function burst(x, y, col, n) {
    for (var i = 0; i < (n || 12); i++) {
        var a = Math.random() * Math.PI * 2, sp = 1.8 + Math.random() * 4;
        particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, alpha: 1, r: 1.5 + Math.random() * 3, col: col || '#ffb6c1' });
    }
}
function addRipple(x, y, col) { ripples.push({ x: x, y: y, r: 10, alpha: 0.7, col: col || '255,107,157' }); }
function scorePop(x, y, txt, col) {
    var d = document.createElement('div'); d.className = 'spop';
    d.textContent = txt; d.style.left = x + 'px'; d.style.top = y + 'px';
    if (col) d.style.color = col;
    document.getElementById('ui').appendChild(d);
    setTimeout(function () { if (d.parentNode) d.remove(); }, 800);
}
function flashWarn() {
    var w = document.getElementById('warn-flash');
    w.style.opacity = '1'; setTimeout(function () { w.style.opacity = '0'; }, 220);
}

// MAIN LOOP
var lastT = 0;
function loop(ts) {
    requestAnimationFrame(loop);
    var dt = Math.min((ts - lastT) / 16, 3); lastT = ts;
    basketX += (basketTargetX - basketX) * 0.16;
    basketY = H - 54;

    bgX.fillStyle = '#1a0a14'; bgX.fillRect(0, 0, W, H);
    bgStars.forEach(function (s) {
        s.a += s.da; if (s.a > 1 || s.a < 0) s.da *= -1;
        bgX.beginPath(); bgX.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        bgX.fillStyle = 'rgba(255,200,220,' + Math.max(0, Math.min(1, s.a)).toFixed(2) + ')'; bgX.fill();
    });

    gx.clearRect(0, 0, W, H);
    if (!gameOn) return;

    var br = { x: basketX - basketW / 2, y: basketY, w: basketW, h: 32 };

    if (blindActive) blindAlpha = Math.min(blindAlpha + 0.045 * dt, 0.85);
    else blindAlpha = Math.max(blindAlpha - 0.035 * dt, 0);

    // hearts
    for (var i = hearts.length - 1; i >= 0; i--) {
        var h = hearts[i];
        if (h.dead) { hearts.splice(i, 1); continue; }
        h.wobble += h.wobbleSpeed;
        h.y += h.vy * dt;
        if (D.zigzag) h.x += Math.sin(h.wobble * 1.3 + h.zigPhase) * 1.3;
        else h.x += h.vx;
        h.scale += (h.targetScale - h.scale) * 0.15;

        // basket hit
        if (!h.caught && h.y + h.size > br.y && h.y < br.y + br.h && h.x > br.x - 8 && h.x < br.x + br.w + 8) {
            h.caught = true; handleCatch(h); h.dead = true; continue;
        }
        if (h.y > H + 30) {
            if (!h.bad && !h.caught) { ms++; playBuzz(); document.getElementById('mv').textContent = ms; combo = 0; }
            h.dead = true; continue;
        }

        gx.save(); gx.globalAlpha = h.alpha;
        gx.translate(h.x, h.y); gx.scale(h.scale, h.scale);
        gx.rotate(Math.sin(h.wobble) * 0.09);
        gx.font = h.size + 'px serif'; gx.textAlign = 'center'; gx.textBaseline = 'middle';
        gx.shadowColor = h.fake ? 'rgba(255,50,50,0.2)' : h.bad ? 'rgba(255,60,60,0.5)' : 'rgba(255,160,193,0.6)';
        gx.shadowBlur = 11; gx.fillText(h.em, 0, 0); gx.restore();
    }

    // particles
    for (var j = particles.length - 1; j >= 0; j--) {
        var p = particles[j];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.18 * dt; p.alpha -= 0.027 * dt;
        if (p.alpha <= 0) { particles.splice(j, 1); continue; }
        gx.beginPath(); gx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        gx.fillStyle = p.col; gx.globalAlpha = p.alpha; gx.fill(); gx.globalAlpha = 1;
    }

    // ripples
    for (var k = ripples.length - 1; k >= 0; k--) {
        var rp = ripples[k];
        rp.r += 4.5 * dt; rp.alpha -= 0.044 * dt;
        if (rp.alpha <= 0) { ripples.splice(k, 1); continue; }
        gx.beginPath(); gx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        gx.strokeStyle = 'rgba(' + rp.col + ',' + rp.alpha.toFixed(2) + ')'; gx.lineWidth = 2; gx.stroke();
        gx.beginPath(); gx.arc(rp.x, rp.y, rp.r * 0.55, 0, Math.PI * 2);
        gx.strokeStyle = 'rgba(192,132,252,' + (rp.alpha * 0.45).toFixed(2) + ')'; gx.lineWidth = 1; gx.stroke();
    }

    // blind overlay
    if (blindAlpha > 0.01) {
        gx.fillStyle = 'rgba(10,0,8,' + blindAlpha.toFixed(2) + ')'; gx.fillRect(0, 0, W, H);
    }

    // basket draw
    gx.save();
    gx.shadowColor = 'rgba(255,107,157,0.75)'; gx.shadowBlur = 14 + Math.sin(ts * 0.003) * 6;
    var rimG = gx.createLinearGradient(br.x, 0, br.x + br.w, 0);
    rimG.addColorStop(0, '#f8bbd0'); rimG.addColorStop(0.5, '#ce93d8'); rimG.addColorStop(1, '#f8bbd0');
    gx.fillStyle = rimG; gx.beginPath(); gx.roundRect(br.x - 3, br.y - 9, br.w + 6, 10, 5); gx.fill();
    var bodG = gx.createLinearGradient(0, br.y, 0, br.y + br.h);
    bodG.addColorStop(0, '#f48fb1'); bodG.addColorStop(1, '#e91e63');
    gx.fillStyle = bodG; gx.beginPath();
    gx.moveTo(br.x, br.y); gx.lineTo(br.x + br.w, br.y);
    gx.quadraticCurveTo(br.x + br.w, br.y + br.h, br.x + br.w / 2, br.y + br.h);
    gx.quadraticCurveTo(br.x, br.y + br.h, br.x, br.y); gx.fill();
    gx.restore();
}

function handleCatch(h) {
    if (h.bad || h.fake) {
        playBuzz(); combo = 0;
        burst(h.x, h.y, '#ff4444', 18); addRipple(h.x, h.y, '255,60,60');
        scorePop(h.x, h.y - 22, 'GAME OVER 💔', '#ff8888');
        flashWarn();
        document.getElementById('wrap').classList.add('shake');
        setTimeout(function () { document.getElementById('wrap').classList.remove('shake'); }, 340);
        endGame(); return;
    }
    sc++; combo++; if (combo > maxCombo) maxCombo = combo;
    var b = combo >= 6 ? 4 : combo >= 4 ? 3 : combo >= 2 ? 2 : 1;
    var g = 10 * b; pts += g;
    playChime(combo); burst(h.x, h.y, '#ffb6c1', 14); addRipple(h.x, h.y, '255,107,157');
    scorePop(h.x, h.y - 22, combo >= 2 ? '+' + g + ' x' + combo : '+' + g);
    if (combo >= 2) {
        var cd = document.getElementById('combo-display');
        cd.textContent = 'x' + combo + (combo >= 5 ? ' 🔥🔥' : combo >= 3 ? ' 🔥' : '') + ' COMBO!';
        cd.style.opacity = '1'; clearTimeout(cd._t);
        cd._t = setTimeout(function () { cd.style.opacity = '0'; }, 1400);
    }
    updateHUD(); checkLevel();
    if (sc >= D.target) winGame();
}

function checkLevel() {
    var nl = 1 + Math.floor(sc / 7);
    if (nl > level) {
        level = nl; playLevelUp();
        document.getElementById('level-badge').textContent = 'Lv ' + level;
        var sw = document.getElementById('speed-warn');
        sw.textContent = '⚡ Level ' + level + '!'; sw.style.opacity = '1';
        setTimeout(function () { sw.style.opacity = '0'; }, 1400);
    }
}

function updateHUD() {
    document.getElementById('sv').textContent = sc;
    document.getElementById('tv').textContent = tl;
    document.getElementById('ptv').textContent = pts;
    document.getElementById('mv').textContent = ms;
    document.getElementById('prog-inner').style.width = Math.min(100, (sc / D.target * 100)) + '%';
}

function hideGameUI() {
    document.getElementById('hud').style.display = 'none';
    document.getElementById('mute-btn').style.display = 'none';
    document.getElementById('level-badge').style.display = 'none';
    document.getElementById('diff-badge').style.display = 'none';
}

function startGame() {
    initAudio(); D = DIFF[selDiff];
    sc = 0; pts = 0; ms = 0; tl = D.time; combo = 0; maxCombo = 0; level = 1; gameOn = true; warnShown = false;
    hearts = []; particles = []; ripples = []; blindAlpha = 0; blindActive = false;
    basketX = basketTargetX = W / 2; basketW = D.baskW;
    curSpawnMs = D.spawnMs; curBad = D.badChance; curSpd = D.spdBase;

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('mute-btn').style.display = 'block';
    document.getElementById('level-badge').style.display = 'block';
    document.getElementById('level-badge').textContent = 'Lv 1';
    var db = document.getElementById('diff-badge');
    db.style.display = 'block'; db.textContent = D.label;
    db.style.color = D.color; db.style.background = D.bc; db.style.border = '0.5px solid ' + D.bb;

    updateHUD();
    if (musicOn) startArp();

    tInt = setInterval(function () {
        tl--; document.getElementById('tv').textContent = tl;
        if (!warnShown && tl <= 10 && tl > 0) {
            warnShown = true;
            var sw = document.getElementById('speed-warn');
            sw.textContent = '⏰ ' + tl + 's baki!'; sw.style.opacity = '1';
            setTimeout(function () { sw.style.opacity = '0'; }, 1200);
        }
        if (tl <= 0) endGame();
    }, 1000);

    spInt = setInterval(function () {
        spawnHeart();
        if (level >= 2) spawnHeart();
        if (level >= 4 && Math.random() < 0.5) spawnHeart();
    }, curSpawnMs);

    startDiffRamp();
    spawnHeart(); spawnHeart();
}

function winGame() {
    gameOn = false; clearInterval(tInt); clearInterval(spInt); clearInterval(diffInt); stopArp();
    playFanfare();
    for (var i = 0; i < 7; i++) {
        setTimeout((function (ii) { return function () { burst(Math.random() * W, 50 + Math.random() * H * 0.45, '#ffb6c1', 24); }; })(i), i * 180);
    }
    setTimeout(function () {
        hearts = []; hideGameUI();
        document.getElementById('special-screen').style.display = 'flex';
        playLoveSong();
        document.getElementById('special-msg').innerHTML =
            '💌 Mili ❤️<br>' +
            'Tumi jano na babu tumi amar jonne koto ta special…<br>' +
            'Tomar ekta hashi amar pura din ta ke shundor kore dey 😊<br><br>' +

            'Ami jani majhe majhe bhul hoye jay,<br>' +
            'kintu bishash koro, ami tomake khub valobasi ❤️<br>' +
            'Amar mon shudhu tomake niyei bhora…<br><br>' +

            'Chai tumi emni hashi khushi thako,<br>' +
            'ar ami tomar pashe shob shomoy thakbo 🌸<br><br>' +

            'I love you, Mili… always & forever 💝';
    }, 1500);
}

function endGame() {
    gameOn = false; clearInterval(tInt); clearInterval(spInt); clearInterval(diffInt); stopArp();
    setTimeout(function () {
        hearts = []; blindAlpha = 0; hideGameUI();
        document.getElementById('end-screen').style.display = 'flex';
        document.getElementById('escore').textContent = pts + ' pts  |  ' + sc + '/' + D.target;
        var pct = sc / D.target, stars, msg;
        if (pct >= 0.8) { stars = '★★★'; msg = 'Almost! Aro ektu hole special message! 💕\nMax combo: x' + maxCombo + '\nDifficulty: ' + D.label; }
        else if (pct >= 0.5) { stars = '★★☆'; msg = 'Sukhen bole: "Try harder!" 😄\nMax combo: x' + maxCombo; }
        else { stars = '★☆☆'; msg = 'Sukhen bole: "Amar care koro ki?!" 😂\nAro practice!'; }
        document.getElementById('estars').textContent = stars;
        document.getElementById('emsg').textContent = msg;
    }, 500);
}

function resetGame() {
    gameOn = false; hearts = []; particles = []; ripples = []; blindAlpha = 0; stopLoveSong();
    document.getElementById('end-screen').style.display = 'none';
    document.getElementById('special-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    warnShown = false;
}

var wrap = document.getElementById('wrap');
wrap.addEventListener('mousemove', function (e) {
    var r = wrap.getBoundingClientRect(); basketTargetX = e.clientX - r.left;
});
wrap.addEventListener('touchmove', function (e) {
    e.preventDefault();
    var r = wrap.getBoundingClientRect(); basketTargetX = e.touches[0].clientX - r.left;
}, { passive: false });
gc.addEventListener('click', function (e) {
    if (!gameOn) return;
    var r = gc.getBoundingClientRect();
    var cx = e.clientX - r.left, cy = e.clientY - r.top;
    for (var i = hearts.length - 1; i >= 0; i--) {
        var h = hearts[i];
        if (h.dead || h.caught) continue;
        var dx = cx - h.x, dy = cy - h.y;
        if (Math.sqrt(dx * dx + dy * dy) < h.size + 6) {
            h.caught = true; h.targetScale = 1.5;
            handleCatch(h);
            setTimeout(function (hh) { hh.dead = true; }(h), 100); break;
        }
    }
});

requestAnimationFrame(loop);
