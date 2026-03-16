export class UI {
  constructor() {
    this.hudHearts = document.getElementById('hud-hearts');
    this.hudScore = document.getElementById('hud-score');
    this.hudLevel = document.getElementById('hud-level');
    this.hudBest = document.getElementById('hud-best');
    this.starTimerEl = document.getElementById('star-timer');
    this.pauseBtn = document.getElementById('pause-btn');
    this.overlay = document.getElementById('overlay');
    this.overlayBox = document.getElementById('overlay-box');
    this.popupDiv = document.getElementById('popup-text');
    this.rotateMsg = document.getElementById('rotate-msg');
    this.bossBar = document.getElementById('boss-bar');
    this.bossBarFill = document.getElementById('boss-bar-fill');
    this.dashCooldown = document.getElementById('dash-cooldown');
    this.flashOverlay = document.getElementById('flash-overlay');

    this.popupTimer = 0;
    this.isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    this._initOrientationCheck();
  }

  _initOrientationCheck() {
    if (!this.isMobile || !this.rotateMsg) return;
    // show as a brief suggestion, not a blocker
    if (window.innerHeight > window.innerWidth) {
      this.rotateMsg.style.display = 'flex';
      setTimeout(() => { this.rotateMsg.style.opacity = '0'; }, 2500);
      setTimeout(() => { this.rotateMsg.style.display = 'none'; this.rotateMsg.style.opacity = '1'; }, 3200);
    }
  }

  updateHUD(lives, score, level, bestScore) {
    let h = '';
    for (let i = 0; i < 3; i++) h += i < lives ? '♥' : '♡';
    this.hudHearts.textContent = h;
    this.hudScore.textContent = 'Punti: ' + score;
    this.hudLevel.textContent = 'Lv.' + level;
    this.hudBest.textContent = bestScore > 0 ? '🏆 ' + bestScore : '';
  }

  updateStarTimer(timeLeft) {
    if (timeLeft > 0) {
      this.starTimerEl.style.display = 'block';
      this.starTimerEl.textContent = '⭐ ' + Math.ceil(timeLeft) + 's';
    } else {
      this.starTimerEl.style.display = 'none';
    }
  }

  showPopup(text, color) {
    this.popupDiv.textContent = text;
    this.popupDiv.style.color = color || '#fff';
    this.popupDiv.classList.add('show');
    this.popupTimer = 90;
  }

  tickPopup() {
    if (this.popupTimer > 0) {
      this.popupTimer--;
      if (this.popupTimer <= 0) this.popupDiv.classList.remove('show');
    }
  }

  showOverlay(html) {
    this.overlayBox.innerHTML = html;
    this.overlay.classList.add('active');
    this.overlay.style.display = 'flex';
  }

  hideOverlay() {
    this.overlay.classList.remove('active');
    this.overlay.style.display = 'none';
  }

  showPauseBtn() { this.pauseBtn.style.display = 'flex'; }
  hidePauseBtn() { this.pauseBtn.style.display = 'none'; }
  setPauseIcon(playing) { this.pauseBtn.textContent = playing ? '⏸' : '▶'; }

  showTitle(onOutfit) {
    const ctrl = this.isMobile
      ? '<p style="font-size:14px;color:#c4b5fd;margin-top:12px;">Bottoni per muoverti, SALTA e DASH</p>'
      : '<p style="font-size:14px;color:#c4b5fd;margin-top:12px;">← → muoversi &nbsp;|&nbsp; ↑/SPAZIO saltare &nbsp;|&nbsp; SHIFT scatto</p>';
    const start = this.isMobile
      ? '<p class="blink">Tocca per iniziare</p>'
      : '<p class="blink">Premi SPAZIO per iniziare</p>';
    this.showOverlay(`
      <h1>Super Francesca</h1>
      <p>Salta sui cuscini, raccogli le ciambelle<br>e attenta ai fantasmini!</p>
      ${ctrl}
      ${start}
      <button id="outfit-btn" class="outfit-btn">👗 Outfit</button>
    `);
    const btn = document.getElementById('outfit-btn');
    if (btn && onOutfit) {
      btn.addEventListener('click', e => { e.stopPropagation(); onOutfit(); });
      btn.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); onOutfit(); }, { passive: false });
    }
  }

  showOutfitScreen(outfits, currentOutfit, unlockedSet, onSelect, onClose) {
    let html = '<h1 style="font-size:28px;margin-bottom:16px;">👗 Outfit</h1><div class="outfit-grid">';
    for (const [id, o] of Object.entries(outfits)) {
      const locked = o.locked && !unlockedSet.has(id);
      const selected = id === currentOutfit;
      const cls = `outfit-card${selected ? ' selected' : ''}${locked ? ' locked' : ''}`;
      html += `<button class="${cls}" data-outfit="${id}">
        <span class="outfit-icon">${locked ? '🔒' : this._outfitIcon(id)}</span>
        <span class="outfit-name">${o.name}</span>
        ${locked ? '<span class="outfit-lock-text">5 cristalli</span>' : ''}
      </button>`;
    }
    html += '</div><button class="outfit-close-btn">✕ Chiudi</button>';
    this.showOverlay(html);

    this.overlayBox.querySelectorAll('.outfit-card:not(.locked)').forEach(btn => {
      const select = () => {
        onSelect(btn.dataset.outfit);
        this.showOutfitScreen(outfits, btn.dataset.outfit, unlockedSet, onSelect, onClose);
      };
      btn.addEventListener('click', e => { e.stopPropagation(); select(); });
      btn.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); select(); }, { passive: false });
    });
    const closeBtn = this.overlayBox.querySelector('.outfit-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', e => { e.stopPropagation(); onClose(); });
      closeBtn.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); onClose(); }, { passive: false });
    }
  }

  _outfitIcon(id) {
    const icons = { default: '👧', princess: '👑', ninja: '🥷', panda: '🐼', rainbow: '🌈', dolce: '🍩' };
    return icons[id] || '👧';
  }

  showGameOver(score, bestScore, isNewRecord) {
    this.showOverlay(`
      <h1 class="red">GAME OVER</h1>
      <p>Punteggio: ${score}</p>
      ${isNewRecord ? '<p style="color:#fde68a;font-weight:bold">🏆 NUOVO RECORD!</p>' : ''}
      <p class="blink">${this.isMobile ? 'Tocca per riprovare' : 'Premi SPAZIO per riprovare'}</p>
    `);
  }

  showWin(score, bestScore, isNewRecord) {
    const starCount = score >= 500 ? 3 : score >= 250 ? 2 : 1;
    const starHtml = '<div class="star-rating">' +
      '⭐'.repeat(starCount).split('').map(s => `<span>${s}</span>`).join('') + '</div>';
    this.showOverlay(`
      <h1>BRAVISSIMA! 🎉</h1>
      ${starHtml}
      <p style="margin-top:12px">Punteggio: ${score}</p>
      ${isNewRecord ? '<p style="color:#fde68a;font-weight:bold">🏆 NUOVO RECORD!</p>' : ''}
      <p class="blink">${this.isMobile ? 'Tocca per rigiocare' : 'Premi SPAZIO per rigiocare'}</p>
    `);
  }

  showPause() {
    this.showOverlay('<h1 style="color:#e9d5ff">IN PAUSA</h1><p class="blink" style="margin-top:20px">Tocca per riprendere</p>');
  }

  showLevelComplete(level) {
    this.showPopup(level >= 5 ? 'HAI VINTO!' : 'LIVELLO COMPLETATO!', '#fbbf24');
  }

  showRecap(stats) {
    this.showOverlay(`
      <h1 style="font-size:28px">Livello ${stats.level} completato!</h1>
      <div style="text-align:left;display:inline-block;margin:12px 0;line-height:2">
        <p>🍩 Ciambelle: ${stats.donutsCollected}/${stats.donutsTotal}</p>
        <p>👻 Fantasmi: ${stats.ghostsKilled}</p>
        <p>⏱ Tempo: ${stats.time}s</p>
        ${stats.bonus > 0 ? `<p style="color:#fde68a">⚡ Bonus velocità: +${stats.bonus}</p>` : ''}
        ${stats.crystalFound ? '<p style="color:#a78bfa">💎 Cristallo trovato!</p>' : ''}
      </div>
      <p class="blink">${this.isMobile ? 'Tocca per continuare' : 'Premi SPAZIO per continuare'}</p>
    `);
  }

  showBossHP(hp, maxHp) {
    if (!this.bossBar) return;
    this.bossBar.style.display = 'block';
    const pct = Math.max(0, hp / maxHp * 100);
    this.bossBarFill.style.width = pct + '%';
    this.bossBarFill.style.background = pct > 50 ? '#a855f7' : pct > 25 ? '#f59e0b' : '#ef4444';
  }

  hideBossHP() {
    if (this.bossBar) this.bossBar.style.display = 'none';
  }

  updateDashCooldown(progress) {
    if (!this.dashCooldown) return;
    if (progress >= 1) {
      this.dashCooldown.style.display = 'none';
    } else {
      this.dashCooldown.style.display = 'block';
      this.dashCooldown.style.background = `conic-gradient(rgba(255,255,255,0.6) ${progress * 360}deg, rgba(255,255,255,0.15) 0deg)`;
    }
  }

  flash(duration = 0.15) {
    if (!this.flashOverlay) return;
    this.flashOverlay.style.opacity = '0.6';
    setTimeout(() => { this.flashOverlay.style.opacity = '0'; }, duration * 1000);
  }
}
