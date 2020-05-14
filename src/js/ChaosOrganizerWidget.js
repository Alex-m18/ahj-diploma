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
    this.showMapClickEventListeners = [];
    this.fileClickEventListeners = [];
    this.pictureClickEventListeners = [];
    this.logoutClickEventListeners = [];
    this.postCreatedEventListeners = [];
  }

  init() {
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

    this.audioRecordBtn = document.createElement('span');
    this.audioRecordBtn.classList.add('audio-rec-btn');
    this.choiceBtnsEl.append(this.audioRecordBtn);
    const audioRecordSymb = document.createElement('i');
    audioRecordSymb.classList.add('fas', 'fa-microphone');
    this.audioRecordBtn.append(audioRecordSymb);

    this.videoRecordBtn = document.createElement('span');
    this.videoRecordBtn.classList.add('video-rec-btn');
    this.choiceBtnsEl.append(this.videoRecordBtn);
    const videoRecordSymb = document.createElement('i');
    videoRecordSymb.classList.add('fas', 'fa-video');
    this.videoRecordBtn.append(videoRecordSymb);

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

    // Form
    this.coordinatesForm = new CoordinatesForm(document.body);
    this.coordinatesForm.init();

    // Add event listeners
    this.inputEl.addEventListener('keyup', this.onInputKeyUp.bind(this));
    this.fileBtn.addEventListener('click', this.onFileBtnClick.bind(this));
    this.audioRecordBtn.addEventListener('click', this.onAudioRecordClick.bind(this));
    this.videoRecordBtn.addEventListener('click', this.onVideoRecordClick.bind(this));
    this.stopRecordBtn.addEventListener('click', this.onStopRecord.bind(this));
    this.cancelRecordBtn.addEventListener('click', this.onCancelRecord.bind(this));
    this.logoutBtn.addEventListener('click', this.onLogoutClick.bind(this));
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
  // #endregion

  // #region Post event listeners
  addPinClickEventListener(callback) {
    this.pinClickEventListeners.push(callback);
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

  update(posts) {
    this.posts.forEach((p) => p.remove());

    posts.forEach((p) => { this.addPost(p); });
    this.scrollDown();
  }

  addPost(post) {
    const newPost = new PostWidget(post);
    if (post.pinned) newPost.enablePin();
    newPost.addMouseEnterEventListener(() => newPost.showPin());
    newPost.addMouseLeaveEventListener(() => {
      if (!newPost.pinned) newPost.hidePin();
    });

    newPost.addPinClickEventListener(this.onPinClick.bind(this));
    newPost.addShowMapClickEventListener(this.onShowMapClick.bind(this));
    if (newPost.file) newPost.addFileClickEventListener(this.onFileClick.bind(this));
    if (newPost.picture) newPost.addPictureClickEventListener(this.onPictureClick.bind(this));
    this.posts.push(newPost);

    if (newPost.pinned) {
      this.pinnedAreaEl.append(newPost.element);
    } else {
      this.insertPost(newPost);
    }
  }

  insertPost(post) {
    const nextPosts = this.posts
      .filter((p) => new Date(p.created_at) > new Date(post.created_at));
    if (!nextPosts.length) {
      this.timelineEl.append(post.element);
    } else {
      this.timelineEl.insertBefore(post.element, nextPosts[0].element);
    }
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
