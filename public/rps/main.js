(() => {
  const ROCK = '石', SCIS = '刀', PAPR = '布';

  /** @param {'石'|'刀'|'布'} name */
  function targetNameOf(name) {
    switch (name) {
      case ROCK: return SCIS;
      case SCIS: return PAPR;
      case PAPR: return ROCK;
    }
  }

  /** @param {'石'|'刀'|'布'} name */
  function ghostNameOf(name) {
    switch (name) {
      case ROCK: return PAPR;
      case SCIS: return ROCK;
      case PAPR: return SCIS;
    }
  }

  let screenW = 0, screenH = 0;

  function resetScreenSize() {
    screenW = window.innerWidth, screenH = window.innerHeight;
  }

  resetScreenSize();

  const bounce = 32;
  /**
   * @param {HTMLElement} el
   * @param {number} x
   * @param {number} y
   */
  function setCenterXY(el, x, y) {
    if (x < bounce) x = Math.max(0, x + baseSpeed * Math.random());
    else if (x > screenW - bounce) x = Math.min(screenW, x - baseSpeed * Math.random());
    if (y < bounce) y = Math.max(0, y + baseSpeed * Math.random());
    else if (y > screenH - bounce) y = Math.min(screenH, y - baseSpeed * Math.random());
    el.style.setProperty('--centerx', `${x}px`);
    el.style.setProperty('--centery', `${y}px`);
  }

  /** @type {Player[]} */
  const players = [];
  const groups = {
    /** @type {Set<Player>} */
    [ROCK]: new Set(),
    /** @type {Set<Player>} */
    [SCIS]: new Set(),
    /** @type {Set<Player>} */
    [PAPR]: new Set(),
  }

  class Player {
    /** @type {'石'|'刀'|'布'} */
    #name

    /**
     * @param {'石'|'刀'|'布'} name
     * @param {HTMLElement} gameMap
     */
    constructor(name, gameMap) {
      const el = document.createElement('div');
      el.classList.add('player');
      /** @type {HTMLElement} */
      this.el = el;
      /** @type {number} */
      this.speedBuff = Math.random() * 0.025;
      this.center = [Math.random() * screenW, Math.random() * screenH];
      this.name = name;
      gameMap.appendChild(el);
      players.push(this);
    }

    get name() {
      return this.#name;
    }

    set name(value) {
      this.el.innerText = value;
      this.el.classList.remove(this.#name);
      this.el.classList.add(value);
      if (this.#name) groups[this.#name].delete(this);
      groups[value].add(this);
      this.#name = value;
    }

    /** @returns {[number,number]} */
    get center() {
      const { x, y, width, height } = this.el.getBoundingClientRect();
      return [x + width / 2, y + height / 2];
    }

    set center(value) {
      setCenterXY(this.el, ...value);
    }

    /** @returns {[number,number,number,number]} */
    get rect() {
      const { x, y, width, height } = this.el.getBoundingClientRect();
      return [x, y, x + width, y + height];
    }

    /** @returns {number} */
    get speed() {
      return baseSpeed + baseSpeed * this.speedBuff;
    }

    /** @param {string} name  */
    convertTo(name) {
      this.name = name;
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    moveto(x, y) {
      const [x0, y0] = this.center;
      const dx = x0 - x, dy = y0 - y, da = Math.abs(dx) + Math.abs(dy);
      setCenterXY(this.el, x0 + this.speed * -dx / da, y0 + this.speed * -dy / da);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    runaway(x, y) {
      const [x0, y0] = this.center;
      const dx = x0 - x, dy = y0 - y, da = Math.abs(dx) + Math.abs(dy);
      setCenterXY(this.el, x0 + this.speed * dx / da, y0 + this.speed * dy / da);
    }

    /**
     * @param {number} topleftx
     * @param {number} toplefty
     * @param {number} bottomrightx
     * @param {number} bottomrighty
     */
    isColideRect(topleftx, toplefty, bottomrightx, bottomrighty) {
      const [x0, y0, x1, y1] = this.rect;
      for (const corner of [
        [topleftx, toplefty],
        [topleftx, bottomrighty],
        [bottomrightx, toplefty],
        [bottomrightx, bottomrighty]
      ]) {
        const [x, y] = corner;
        if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
          return true;
        }
      }
      return false;
    }
  }

  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * @param {[number,number][]} coordinates
   * @returns {[number,number]}
   */
  function coordinatesAverage(...coordinates) {
    let x = 0, y = 0;
    for (const coor of coordinates) x += coor[0], y += coor[1];
    return [x / coordinates.length, y / coordinates.length];
  }

  let baseSpeed = 1;
  let end = false;

  window.addEventListener('load', () => {
    const gameMap = document.getElementById('rps-map');

    const total = Math.ceil(window.innerHeight * window.innerWidth / 32000);
    for (let i = 0; i < total; i++) {
      new Player(ROCK, gameMap);
      new Player(SCIS, gameMap);
      new Player(PAPR, gameMap);
    }
    
    setInterval(() => {
      resetScreenSize();
      baseSpeed += 0.1;
    }, 1000);

    for (const player of players) setInterval(() => {
      const playerName = player.name;
      const playerCenter = player.center;
      const ghosts = groups[ghostNameOf(playerName)];
      const nearlyGhostsCoors = [...ghosts]
        .map(i => i.center)
        .filter(c => distance(...playerCenter, ...c) < 80);
      if (nearlyGhostsCoors.length) {
        const [gx, gy] = coordinatesAverage(...nearlyGhostsCoors);
        player.runaway(gx, gy);
        return;
      }
      const targets = groups[targetNameOf(playerName)];
      if (targets.size) {
        let minTargetDistance = Infinity;
        /** @type {[number,number]} */
        let targetCenter;
        const [x0, y0, x1, y1] = player.rect;
        for (const target of targets) {
          if (target.isColideRect(x0, y0, x1, y1)) {
            target.convertTo(playerName);
            continue;
          }
          const d = distance(...playerCenter, ...target.center);
          if (d < minTargetDistance) minTargetDistance = d, targetCenter = target.center;
        };
        player.moveto(...targetCenter);
      } else {
        if (!end && !ghosts.size) {
          end = true;
          setTimeout(() => location.reload(), 3000);
        } else {
          const r = Math.random();
          player.moveto(
            playerCenter[0] + (Math.random() > 0.5 ? 1 : -1) * r,
            playerCenter[1] + (Math.random() > 0.5 ? 1 : -1) * (1 - r)
          );
        }
      }
    }, 1);
  });

})();