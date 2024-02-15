(() => {
  let isLoading = false;

  /** @type {Uint8Array[]} */
  const fileBuffers = [];
  window.fileBuffers = fileBuffers;

  /** @type {HTMLElement} */
  const mainEl = document.querySelector('#main');

  /** @type {HTMLElement} */
  const mainMessageEl = document.querySelector('#main-message');

  /** @type {HTMLElement} */
  const filesUploadButtonEl = document.querySelector('#files-upload-button');
  filesUploadButtonEl.addEventListener('click', () => {
    if (isLoading) return;
    filesInputEl.click();
  });

  /** @param {ReadableStream<Uint8Array>} stream */
  const readStream = async (stream) => {
    const reader = stream.getReader();
    /** @type {Uint8Array[]} */
    const buffers = [];
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      buffers.push(value);
    }
    const array = new Uint8Array(buffers.reduce((size, arr) => size + arr.length, 0));
    let offset = 0;
    for (const buffer of buffers) {
      array.set(buffer, offset);
      offset += buffer.length;
    }
    return array;
  }

  /** @param {string} s */
  const log = (...args) => {
    const message = args.map(i => String(i)).join(' ').trim();
    mainMessageEl.innerText = message;
    if (message) console.log(message);
  }

  /** @type {string} */
  let taskId = '';
  /** @type {number} */
  let lastConvertAt = 0;
  /** @type {HTMLElement} */
  const filesConvertButtonEl = document.querySelector('#files-convert-button');
  filesConvertButtonEl.addEventListener('click', async () => {
    if (isLoading) return;
    isLoading = true;
    log('loading...');
    try {
      if (Date.now() - lastConvertAt > 10 * 60000) {
        taskId = (await (await fetch('/images-to-pdf/create-task', {method: 'POST'})).json())?.id;
        if (typeof taskId !== 'string') throw new Error('Failed to create task');
        log('created task:', taskId);
        let done = 0;
        const {length} = fileBuffers;
        await Promise.all(fileBuffers.map(async (buff, i) => {
          await fetch(`/images-to-pdf/upload/${taskId}/${i}`, {
            method: 'POST',
            body: buff,
            headers: {'Content-Type': 'application/uint8array'}
          });
          log(`uploaded: ${++done} / ${length}`);
        }));
      }
      const filename = `${outputFilenameEl.value.trim() || `${Date.now()}.pdf`}`;
      log('coverting...');
      const res = await fetch(`/images-to-pdf/convert/${taskId}/${filename}`, {method: 'POST'});
      const pdf = await readStream(res.body);
      lastConvertAt = Date.now();
      log('converted:', filename);
      const blob = new Blob([pdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = filename;
      a.target = '_blank';
      a.href = url;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      log('something went wrong!');
    } finally {
      isLoading = false;
    }
  });
  
  /** @type {HTMLInputElement} */
  const filesInputEl = document.querySelector('#files-input');
  /** @type {HTMLInputElement} */
  const outputFilenameEl = document.querySelector('#output-filename');
  const fileListEl = document.querySelector('#file-list');

  filesInputEl.addEventListener('change', async (e) => {
    lastConvertAt = 0;
    log('preparing...');
    const {files} = filesInputEl;
    for (const child of [...fileListEl.childNodes]) child.remove();
    const titleEl = document.createElement('h2');
    titleEl.id = 'files-upload-title';
    titleEl.innerText = 'Files';
    fileListEl.appendChild(titleEl);
    const fileCountEl = document.createElement('p');
    fileCountEl.id = 'files-upload-total';
    fileCountEl.innerText = `total files: ${files.length}`;
    fileListEl.appendChild(fileCountEl);
    fileBuffers.splice(0, fileBuffers.length);
    if (files.length > 0) filesConvertButtonEl.classList.remove('locked');
    else filesConvertButtonEl.classList.add('locked');
    for (const file of files) {
      const fileitemEl = document.createElement('div');
      const fileNameEl = document.createElement('div');
      const fileSizeEl = document.createElement('div');
      fileNameEl.innerText = file.name;
      fileSizeEl.innerText = `${file.size}b`;
      fileitemEl.classList.add('fileitem');
      fileNameEl.classList.add('filename');
      fileSizeEl.classList.add('filesize');
      fileitemEl.appendChild(fileNameEl);
      fileitemEl.appendChild(fileSizeEl);
      fileListEl.appendChild(fileitemEl);
      fileBuffers.push(await readStream(file.stream()));
    }
    log('ready!');
  });
})();
