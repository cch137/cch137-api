(() => {
  const origin = location.origin;
  const ws = new WebSocket(`${origin.replace('http', 'ws')}`);

  /** @type {HTMLDivElement} */
  const viewEl = document.querySelector('#view')

  /** @type {HTMLDivElement} */
  const statusEl = document.querySelector('#status')
  function setStatusCode(status = 2) {
    switch (status) {
      case 0:
        statusEl.style.color = '#f00';
        break;
      case 1:
        statusEl.style.color = '#0f0';
        break;
      case 2:
        statusEl.style.color = '#ff0';
        break;
    }
  }
  function setStatusMessage(text, code = null) {
    statusEl.innerText = text;
    if (code !== null) setStatusCode(code);
  }

  const keyW = document.querySelector('#key-w');
  keyW.addEventListener('mousedown', () => pressingKeys.add('W'));
  keyW.addEventListener('mouseup', () => pressingKeys.delete('W'));
  keyW.addEventListener('mouseleave', () => pressingKeys.delete('W'));
  keyW.addEventListener('touchstart', () => pressingKeys.add('W'));
  keyW.addEventListener('touchend', () => pressingKeys.delete('W'));
  keyW.addEventListener('touchcancel', () => pressingKeys.delete('W'));
  const keyD = document.querySelector('#key-d');
  keyD.addEventListener('mousedown', () => pressingKeys.add('D'));
  keyD.addEventListener('mouseup', () => pressingKeys.delete('D'));
  keyD.addEventListener('mouseleave', () => pressingKeys.delete('D'));
  keyD.addEventListener('touchstart', () => pressingKeys.add('D'));
  keyD.addEventListener('touchend', () => pressingKeys.delete('D'));
  keyD.addEventListener('touchcancel', () => pressingKeys.delete('D'));
  const keyS = document.querySelector('#key-s');
  keyS.addEventListener('mousedown', () => pressingKeys.add('S'));
  keyS.addEventListener('mouseup', () => pressingKeys.delete('S'));
  keyS.addEventListener('mouseleave', () => pressingKeys.delete('S'));
  keyS.addEventListener('touchstart', () => pressingKeys.add('S'));
  keyS.addEventListener('touchend', () => pressingKeys.delete('S'));
  keyS.addEventListener('touchcancel', () => pressingKeys.delete('S'));
  const keyA = document.querySelector('#key-a');
  keyA.addEventListener('mousedown', () => pressingKeys.add('A'));
  keyA.addEventListener('mouseup', () => pressingKeys.delete('A'));
  keyA.addEventListener('mouseleave', () => pressingKeys.delete('A'));
  keyA.addEventListener('touchstart', () => pressingKeys.add('A'));
  keyA.addEventListener('touchend', () => pressingKeys.delete('A'));
  keyA.addEventListener('touchcancel', () => pressingKeys.delete('A'));

  const playerColorSetterEl = document.querySelector('#player-color-setter')
  playerColorSetterEl.addEventListener('input', () => {
    /** @type {string} */
    const hexColorCode = playerColorSetterEl.value;
    const r = parseInt(hexColorCode.substring(1, 3), 16);
    const g = parseInt(hexColorCode.substring(3, 5), 16);
    const b = parseInt(hexColorCode.substring(5, 7), 16);
    ws.send(new Uint8Array([102, r, g, b]));
  })

  ws.addEventListener('open', (e) => {
    setStatusMessage('connected', 1);
    ws.send(new Uint8Array([100]));
  });

  function getPlayerEl(id) {
    /** @type {HTMLDivElement} */
    let p = document.querySelector(`#player-${id}`);
    if (p === null) {
      p = document.createElement('div');
      p.classList.add('player');
      p.id = `player-${id}`;
      document.querySelector('.chunk').appendChild(p);
    }
    return p;
  }

  ws.addEventListener('message', async (e) => {
    /** @type {Blob} */
    const data = e.data;
    const [cmd, ...items] = [...new Uint8Array(await data.arrayBuffer())];
    switch (cmd) {
      case 101: // player update coor
        {
          const [id, x, y] = items;
          const p = getPlayerEl(id);
          p.style.setProperty('--x', x);
          p.style.setProperty('--y', y);
        }
        break;
      case 102: // player update color
        {
          const [id, r, g, b] = items;
          const p = getPlayerEl(id);
          p.style.setProperty('--rgb', `rgb(${r},${g},${b})`);
        }
        break;
      case 104: // player disconnected
        document.querySelector(`#player-${items[0]}`).remove();
        break;
      case 112: // save color
        const [r, g, b] = items;
        playerColorSetterEl.value = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        break;
    }
  });

  ws.addEventListener('close', async (e) => {
    setTimeout(() => location.reload(), 1000);
  });

  const pressingKeys = new Set();

  document.body.addEventListener('keydown', (e) => pressingKeys.add(e.key))
  document.body.addEventListener('keyup', (e) => pressingKeys.delete(e.key))
  setInterval(() => {
    if (pressingKeys.size === 0) return;
    let code = 22;
    // x: 01, 02, 03
    // y: 10, 20, 30
    for (const key of pressingKeys) {
      switch (key) {
        case 'w': case 'W': case 'ArrowUp':
          code -= 10;  
        break;
        case 'd': case 'D': case 'ArrowRight':
          code += 1;
          break;
        case 's': case 'S': case 'ArrowDown':
          code += 10;
          break;
        case 'a': case 'A': case 'ArrowLeft':
          code -= 1;
          break;
      }
    }
    if (code === 22) return;
    ws.send(new Uint8Array([101, code]));
  }, 0)
})();
