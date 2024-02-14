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

  /** @type {HTMLElement} */
  const filesConvertButtonEl = document.querySelector('#files-convert-button');
  filesConvertButtonEl.addEventListener('click', async () => {
    if (isLoading) return;
    isLoading = true;
    mainMessageEl.innerText = 'loading...';
    try {
      const taskId = (await (await fetch('/images-to-pdf/create-task', {method: 'POST'})).json())?.id;
      if (typeof taskId !== 'string') throw new Error('Failed to create task');
      console.log('created task:', taskId);
      let done = 0;
      const {length} = fileBuffers;
      await Promise.all(fileBuffers.map(async (buff, i) => {
        await fetch(`/images-to-pdf/upload/${taskId}/${i}`, {
          method: 'POST',
          body: buff,
          headers: {'Content-Type': 'application/uint8array'}
        });
        done++;
        console.log('uploaded:', done, '/', length);
      }));
      const filename = `${outputFilenameEl.value.trim() || Date.now()}`;
      const res = await fetch(`/images-to-pdf/convert/${taskId}/${filename}`, {method: 'POST'});
      const pdf = await readStream(res.body);
      console.log('converted:', filename);
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
    } finally {
      isLoading = false;
      mainMessageEl.innerText = '';
    }
  });
  
  /** @type {HTMLInputElement} */
  const filesInputEl = document.querySelector('#files-input');
  /** @type {HTMLInputElement} */
  const outputFilenameEl = document.querySelector('#output-filename');
  const fileListEl = document.querySelector('#file-list');

  filesInputEl.addEventListener('change', async (e) => {
    for (const child of [...fileListEl.childNodes]) child.remove();
    const titleEl = document.createElement('h2');
    titleEl.id = 'files-upload-title';
    titleEl.innerText = 'Files';
    fileListEl.appendChild(titleEl);
    const {files} = filesInputEl;
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
  });
})();
