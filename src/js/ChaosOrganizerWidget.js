/* eslint-disable no-alert */
import PostWidget from './PostWidget';
import CoordinatesForm from './CoordinatesForm';
import { addZero } from './formatDate';

export default class ChaosOrganizerWidget {
  constructor() {
    this.container = null;
    this.element = null;
    this.posts = [];
    this.coordinatesForm = null;
    this.recordTimerID = null;
    this.recorder = null;
    this.pinClickEventListeners = [];
    this.favClickEventListeners = [];
    this.favClickEventListeners = [];
    this.showMapClickEventListeners = [];
    this.fileClickEventListeners = [];
    this.pictureClickEventListeners = [];
    this.logoutClickEventListeners = [];
    this.postCreatedEventListeners = [];
    this.scrollTopListeners = [];
    this.searchEventListeners = [];
  }

  async init() {
    // Base element
    this.element = document.createElement('div');
    this.element.classList.add('chaos-widget');
    this.element.id = 'chaos-widget';
    this.container.append(this.element);

    // User info area
    this.userAreaEl = document.createElement('div');
    this.userAreaEl.classList.add('user-info');
    this.element.append(this.userAreaEl);

    this.userNameEl = document.createElement('div');
    this.userNameEl.classList.add('user-name');
    this.userAreaEl.append(this.userNameEl);

    this.searchEl = document.createElement('input');
    this.searchEl.classList.add('search');
    this.searchEl.placeholder = 'Search...';
    this.userAreaEl.append(this.searchEl);

    this.logoutBtn = document.createElement('div');
    this.logoutBtn.classList.add('user-logout');
    this.logoutBtn.title = 'Выйти';
    this.userAreaEl.append(this.logoutBtn);

    const logoutSymb = document.createElement('i');
    logoutSymb.classList.add('fas', 'fa-sign-out-alt');
    this.logoutBtn.append(logoutSymb);

    // Pinned post area
    this.pinnedAreaEl = document.createElement('div');
    this.pinnedAreaEl.classList.add('pinned-area'/* , 'hidden' */);
    this.element.append(this.pinnedAreaEl);

    // Timeline
    this.timelineEl = document.createElement('div');
    this.timelineEl.classList.add('timeline');
    this.element.append(this.timelineEl);

    // Input area
    this.initFileInputEl();

    this.inputAreaEl = document.createElement('div');
    this.inputAreaEl.classList.add('input-area');
    this.element.append(this.inputAreaEl);

    this.videoEl = document.createElement('video');
    this.videoEl.classList.add('video-popup', 'hidden');
    this.videoEl.muted = true;
    this.inputAreaEl.append(this.videoEl);

    this.inputEl = document.createElement('input');
    this.inputEl.classList.add('text-input');
    this.inputEl.type = 'text';
    this.inputEl.placeholder = 'Type this something...';
    this.inputAreaEl.append(this.inputEl);

    // Choice buttons
    this.choiceBtnsEl = document.createElement('div');
    this.choiceBtnsEl.classList.add('choice', 'buttons-area');
    this.inputAreaEl.append(this.choiceBtnsEl);

    this.fileBtn = document.createElement('span');
    this.fileBtn.classList.add('file-btn');
    this.choiceBtnsEl.append(this.fileBtn);
    const fileSymb = document.createElement('i');
    fileSymb.classList.add('fas', 'fa-paperclip');
    this.fileBtn.append(fileSymb);

    navigator.getUserMedia = navigator.getUserMedia
      || navigator.webkitGetUserMedia
      || navigator.mozGetUserMedia;

    if (
      navigator.getUserMedia
      && navigator.mediaDevices
      && navigator.mediaDevices.enumerateDevices
      && window.MediaRecorder
    ) {
      // const devices = await navigator.mediaDevices.enumerateDevices();
      if (window.MediaRecorder.isTypeSupported('audio')) {
        this.audioRecordBtn = document.createElement('span');
        this.audioRecordBtn.classList.add('audio-rec-btn');
        this.choiceBtnsEl.append(this.audioRecordBtn);
        const audioRecordSymb = document.createElement('i');
        audioRecordSymb.classList.add('fas', 'fa-microphone');
        this.audioRecordBtn.append(audioRecordSymb);
      }

      if (window.MediaRecorder.isTypeSupported('video')) {
        this.videoRecordBtn = document.createElement('span');
        this.videoRecordBtn.classList.add('video-rec-btn');
        this.choiceBtnsEl.append(this.videoRecordBtn);
        const videoRecordSymb = document.createElement('i');
        videoRecordSymb.classList.add('fas', 'fa-video');
        this.videoRecordBtn.append(videoRecordSymb);
      }
    }

    // Record control buttons
    this.recordBtnsEl = document.createElement('div');
    this.recordBtnsEl.classList.add('record', 'buttons-area', 'hidden');
    this.inputAreaEl.append(this.recordBtnsEl);

    this.stopRecordBtn = document.createElement('span');
    this.stopRecordBtn.classList.add('stop-rec-btn');
    this.recordBtnsEl.append(this.stopRecordBtn);
    const stopRecordSymb = document.createElement('i');
    stopRecordSymb.classList.add('fas', 'fa-stop');
    this.stopRecordBtn.append(stopRecordSymb);

    this.recordTimeEl = document.createElement('span');
    this.recordTimeEl.classList.add('record-time');
    this.recordTimeEl.textContent = '00:00';
    this.recordBtnsEl.append(this.recordTimeEl);

    this.cancelRecordBtn = document.createElement('span');
    this.cancelRecordBtn.classList.add('cancel-rec-btn');
    this.recordBtnsEl.append(this.cancelRecordBtn);
    const cancelRecordSymb = document.createElement('i');
    cancelRecordSymb.classList.add('fas', 'fa-times');
    this.cancelRecordBtn.append(cancelRecordSymb);

    // Drop area
    this.dropArea = document.createElement('div');
    this.dropArea.classList.add('drop-area');
    this.element.append(this.dropArea);

    const dropIcon = document.createElement('div');
    dropIcon.classList.add('drop-icon');
    this.dropArea.append(dropIcon);
    const dropSymb = document.createElement('i');
    dropSymb.classList.add('fas', 'fa-file');
    dropIcon.append(dropSymb);

    const dropText = document.createElement('div');
    dropText.classList.add('drop-text');
    dropText.textContent = 'DROP FILES HERE';
    this.dropArea.append(dropText);


    // Form
    this.coordinatesForm = new CoordinatesForm(this.container);
    this.coordinatesForm.init();

    // Add event listeners
    this.inputEl.addEventListener('keyup', this.onInputKeyUp.bind(this));
    this.searchEl.addEventListener('keyup', this.onSearchKeyUp.bind(this));
    this.searchEl.addEventListener('focusin', this.onSearchFocusIn.bind(this));
    this.fileBtn.addEventListener('click', this.onFileBtnClick.bind(this));
    if (this.audioRecordBtn) {
      this.audioRecordBtn.addEventListener('click', this.onAudioRecordClick.bind(this));
    }
    if (this.audioRecordBtn) {
      this.videoRecordBtn.addEventListener('click', this.onVideoRecordClick.bind(this));
    }
    this.stopRecordBtn.addEventListener('click', this.onStopRecord.bind(this));
    this.cancelRecordBtn.addEventListener('click', this.onCancelRecord.bind(this));
    this.logoutBtn.addEventListener('click', this.onLogoutClick.bind(this));
    this.timelineEl.addEventListener('scroll', this.onScroll.bind(this));

    this.element.addEventListener('dragover', this.onDragOver.bind(this));
    this.element.addEventListener('dragleave', this.onDragLeave.bind(this));
    this.element.addEventListener('dragend', this.onDragLeave.bind(this));
    this.element.addEventListener('drop', this.onDrop.bind(this));
  }

  initFileInputEl() {
    if (this.fileInputEl) this.fileInputEl.remove();

    this.fileInputEl = document.createElement('input');
    this.fileInputEl.classList.add('file-input');
    this.fileInputEl.type = 'file';
    this.fileInputEl.accept = '*';

    this.element.insertAdjacentElement('afterbegin', this.fileInputEl);
    this.fileInputEl.addEventListener('change', this.onFileInput.bind(this));
  }

  // #region Widget event listeners
  addLogoutClickEventListener(callback) {
    this.logoutClickEventListeners.push(callback);
  }

  addPostCreatedEventListener(callback) {
    this.postCreatedEventListeners.push(callback);
  }

  addScrollTopEventListener(callback) {
    this.scrollTopListeners.push(callback);
  }

  addSearchEventListener(callback) {
    this.searchEventListeners.push(callback);
  }

  onLogoutClick() {
    this.logoutClickEventListeners.forEach((c) => c.call(null));
  }

  onPostCreated(post) {
    this.postCreatedEventListeners.forEach((c) => c.call(null, post));
  }

  onFileBtnClick() {
    this.fileInputEl.dispatchEvent(new MouseEvent('click'));
  }

  onFileInput() {
    this.onAddFile(this.fileInputEl.files[0]);
  }

  onAddFile(file) {
    let contentType = 'file';
    if (file.type.startsWith('image/')) contentType = 'picture';
    if (file.type.startsWith('audio/')) contentType = 'audio';
    if (file.type.startsWith('video/')) contentType = 'video';
    const post = {};
    post[contentType] = { name: file.name, blob: file };
    this.createPost(post);
  }

  onScroll() {
    if (this.timelineEl.scrollTop !== 0
      || this.timelineEl.scrollHeight < this.timelineEl.clientHeight) return;
    this.scrollTopListeners.forEach((c) => c.call(null));
  }

  onStartRecord() {
    this.recordCancelled = false;
    this.startTimer();
    this.choiceBtnsEl.classList.add('hidden');
    this.recordBtnsEl.classList.remove('hidden');
  }

  onStartVideoRecord() {
    this.onStartRecord();
    this.videoEl.classList.remove('hidden');
    this.videoEl.srcObject = this.recorder.stream;
    this.videoEl.play();
  }

  onStopRecord() {
    if (this.recorder.state !== 'recording') return;
    this.choiceBtnsEl.classList.remove('hidden');
    this.recordBtnsEl.classList.add('hidden');
    this.videoEl.classList.add('hidden');
    this.stopTimer();
    this.recorder.stop();
    this.recorder.stream.getTracks().forEach((track) => track.stop());
    this.videoEl.srcObject = null;
  }

  onCancelRecord() {
    if (this.recorder.state !== 'recording') return;
    this.recordCancelled = true;
    this.onStopRecord();
  }

  async onVideoRecordClick() {
    try {
      if (!ChaosOrganizerWidget.mediaIsAvailable) throw new Error();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      this.recorder = new MediaRecorder(stream);
      const chunks = [];

      this.recorder.addEventListener('start', this.onStartVideoRecord.bind(this));
      this.recorder.addEventListener('dataavailable', (evt) => chunks.push(evt.data));
      this.recorder.addEventListener('stop', this.onStopRecord.bind(this));

      this.recorder.addEventListener('stop', () => {
        if (!this.recordCancelled) {
          const blob = new Blob(chunks);
          this.createPost({ video: { blob } });
        }
      });

      this.recorder.start();
    } catch (e) {
      if (e.message.toLowerCase().includes('denied')) {
        alert('Вы запретили использование камеры');
        return;
      }
      alert(`Ваш браузер не поддерживает данный функционал.
Обновитесь или попробуйте другой современный браузер`);
      // console.log(e);
    }
  }

  async onAudioRecordClick() {
    if (!ChaosOrganizerWidget.mediaIsAvailable) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      this.recorder = new MediaRecorder(stream);
      const chunks = [];

      this.recorder.addEventListener('start', this.onStartRecord.bind(this));
      this.recorder.addEventListener('dataavailable', (evt) => chunks.push(evt.data));
      this.recorder.addEventListener('stop', this.onStopRecord.bind(this));

      this.recorder.addEventListener('stop', () => {
        if (!this.recordCancelled) {
          const blob = new Blob(chunks);
          this.createPost({ audio: { blob } });
        }
      });

      this.recorder.start();
    } catch (e) {
      alert('Вы запретили использование микрофона');
    }
  }

  onInputKeyUp(evt) {
    if (this.inputEl.value.trim() !== '' && evt.key === 'Enter') {
      this.createPost({ text: this.inputEl.value.trim() });
      this.inputEl.value = '';
    }
  }

  onSearchKeyUp(evt) {
    if (evt.key === 'Enter') {
      this.searchEventListeners.forEach((c) => c.call(null, this.searchEl.value));
    }
  }

  onSearchFocusIn() {
    this.searchEl.select();
  }

  onDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropArea.classList.add('dragover');
  }

  onDragLeave(evt) {
    if (evt && evt.target !== evt.currentTarget) return;
    this.dropArea.classList.remove('dragover');
  }

  onDrop(event) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (!files) return;
    files.forEach((f) => this.onAddFile(f));
    this.onDragLeave();
  }
  // #endregion

  // #region Post event listeners
  addPinClickEventListener(callback) {
    this.pinClickEventListeners.push(callback);
  }

  addFavClickEventListener(callback) {
    this.favClickEventListeners.push(callback);
  }

  addShowMapClickEventListener(callback) {
    this.showMapClickEventListeners.push(callback);
  }

  addFileClickEventListener(callback) {
    this.fileClickEventListeners.push(callback);
  }

  addPictureClickEventListener(callback) {
    this.pictureClickEventListeners.push(callback);
  }

  onPinClick(id) {
    this.pinClickEventListeners.forEach((c) => c.call(null, id));
  }

  onFavClick(id) {
    this.favClickEventListeners.forEach((c) => c.call(null, id));
  }

  onShowMapClick(id) {
    this.showMapClickEventListeners.forEach((c) => c.call(null, id));
  }

  onFileClick(id) {
    this.fileClickEventListeners.forEach((c) => c.call(null, id));
  }

  onPictureClick(id) {
    this.pictureClickEventListeners.forEach((c) => c.call(null, id));
  }
  // #endregion

  clearPosts() {
    this.posts.forEach((p) => p.remove());
    this.posts.length = 0;
  }

  update(posts) {
    this.clearPosts();

    posts.forEach((p) => { this.addPost(p); });
    this.scrollDown();
  }

  addPost(post) {
    const firstVisiblePost = this.posts
      .find((p) => p.element.offsetTop > this.timelineEl.scrollTop);
    let offset;
    if (firstVisiblePost) offset = firstVisiblePost.element.offsetTop - this.timelineEl.scrollTop;

    const newPost = new PostWidget(post);
    if (post.pinned) newPost.enablePin();
    if (post.favorite) newPost.enableFav();
    newPost.addMouseEnterEventListener(() => {
      newPost.showPin();
      newPost.showFav();
    });
    newPost.addMouseLeaveEventListener(() => {
      if (!newPost.pinned) newPost.hidePin();
      if (!newPost.favorite) newPost.hideFav();
    });

    newPost.addPinClickEventListener(this.onPinClick.bind(this));
    newPost.addFavClickEventListener(this.onFavClick.bind(this));
    newPost.addShowMapClickEventListener(this.onShowMapClick.bind(this));
    if (newPost.file) newPost.addFileClickEventListener(this.onFileClick.bind(this));
    if (newPost.picture) newPost.addPictureClickEventListener(this.onPictureClick.bind(this));
    this.posts.push(newPost);

    if (newPost.pinned) {
      this.pinnedAreaEl.append(newPost.element);
    } else {
      this.insertPost(newPost);
    }

    if (firstVisiblePost) this.timelineEl.scrollTop = firstVisiblePost.element.offsetTop - offset;
  }

  insertPost(post) {
    const nextPosts = this.posts
      .filter((p) => new Date(p.created_at) > new Date(post.created_at));
    if (!nextPosts.length) {
      this.timelineEl.append(post.element);
      this.scrollDown();
    } else {
      this.timelineEl.insertBefore(post.element, nextPosts[0].element);
    }
    this.posts.sort((a, b) => {
      if (new Date(a.created_at) < new Date(b.created_at)) return -1;
      return 1;
    });
  }

  pinPost(id) {
    const post = this.getPost(id);
    if (this.pinnedAreaEl.children.length) {
      this.unpinPost(this.posts.find((p) => p.pinned).id);
    }
    post.enablePin();
    this.pinnedAreaEl.append(post.element);
  }

  unpinPost(id) {
    const post = this.getPost(id);
    post.disablePin();

    this.insertPost(post);
  }

  starPost(id) {
    const post = this.getPost(id);
    post.enableFav();
  }

  unstarPost(id) {
    const post = this.getPost(id);
    post.disableFav();
  }

  setUserName(name) {
    this.userNameEl.textContent = name;
  }

  startTimer() {
    const initTime = new Date();
    this.recordTimeEl.textContent = '00:00';

    this.recordTimerID = setInterval(() => {
      const t = new Date(Date.now() - initTime);
      this.recordTimeEl.textContent = `${addZero(t.getMinutes())}:${addZero(t.getSeconds())}`;
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.recordTimerID);
  }

  getPost(id) {
    return this.posts.find((o) => o.id === id);
  }

  async createPost(options) {
    const opt = options;
    if (!opt.coordinates) {
      opt.coordinates = await this.getCoordinates();
    }
    if (!opt.text && this.inputEl.value.trim() !== '') {
      opt.text = this.inputEl.value;
    }
    this.postCreatedEventListeners.forEach((c) => c.call(null, opt));
  }

  async getCoordinates() {
    if (!navigator.geolocation) return null;

    const coords = await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ lat: latitude.toFixed(6), lon: longitude.toFixed(6) });
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            resolve(null);
            return;
          }
          this.coordinatesForm.show(
            (data) => {
              this.coordinatesForm.hide();
              resolve(data);
            },
            () => {
              this.coordinatesForm.hide();
              resolve(null);
            },
          );
        },
      );
    });
    return coords;
  }

  bindToDOM(container) {
    this.container = container;
  }

  unbindFromDOM() {
    this.element.remove();
  }

  scrollDown() {
    setTimeout(() => {
      this.timelineEl.scrollTop = this.timelineEl.scrollHeight;
    }, 500);
  }
}

ChaosOrganizerWidget.mediaIsAvailable = () => {
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    alert(`Ваш браузер не поддерживает данный функционал.
Обновитесь или попробуйте другой современный браузер`);
    return false;
  }
  return true;
};
