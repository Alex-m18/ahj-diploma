import formatDate from './formatDate';
import TextParser from './TextParser';

export default class PostWidget {
  constructor(options) {
    this.id = options.id;
    this.created_at = options.created_at;
    this.coordinates = options.coordinates;
    this.text = options.text;
    this.audio = options.audio;
    this.video = options.video;
    this.file = options.file;
    this.picture = options.picture;
    this.favorite = options.favorite;

    this.container = null;
    this.element = null;
    this.pinClickEventListeners = [];
    this.showMapClickEventListeners = [];
    this.fileClickEventListeners = [];
    this.pictureClickEventListeners = [];
    this.mouseEnterEventListeners = [];
    this.mouseLeaveEventListeners = [];

    this.textParser = new TextParser();
    this.textParser.use(TextParser.searchLinks);
    // this.textParser.use(TextParser.searchCode); // TODO: Add code searcher

    this.init();
    if (options.pinned) {
      this.enablePin();
      this.showPin();
    }
  }

  init() {
    // Set DOM elements
    this.element = document.createElement('div');
    this.element.classList.add('post');
    this.element.setAttribute('data-id', this.id);

    this.messageEl = document.createElement('div');
    this.messageEl.classList.add('post-message');
    this.element.append(this.messageEl);

    this.contentEl = document.createElement('div');
    this.contentEl.classList.add('post-content');
    this.messageEl.append(this.contentEl);

    this.gpsEl = document.createElement('div');
    this.gpsEl.classList.add('post-gps');
    this.messageEl.append(this.gpsEl);

    this.coordsEl = document.createElement('span');
    this.coordsEl.classList.add('post-coordinates');
    this.gpsEl.append(this.coordsEl);

    this.mapBtn = document.createElement('span');
    this.mapBtn.classList.add('map-btn');
    this.mapBtn.title = 'Open map';
    this.gpsEl.append(this.mapBtn);

    const eye = document.createElement('i');
    eye.classList.add('fas', 'fa-eye');
    this.mapBtn.append(eye);

    // Set content
    if (this.text && this.text !== '') {
      const textEl = document.createElement('div');
      textEl.classList.add('text-content');
      textEl.textContent = this.text;
      this.textParser.parse(textEl);
      this.contentEl.append(textEl);
    }
    if (this.audio) {
      const audioEl = document.createElement('audio');
      audioEl.classList.add('audio-content');
      audioEl.setAttribute('data-name', this.audio.name);
      audioEl.controls = true;
      audioEl.src = this.audio.src;
      this.contentEl.append(audioEl);
    }
    if (this.video) {
      const videoEl = document.createElement('video');
      videoEl.classList.add('video-content');
      videoEl.setAttribute('data-name', this.video.name);
      videoEl.controls = true;
      videoEl.src = this.video.src;
      this.contentEl.append(videoEl);
    }
    if (this.file) {
      this.fileEl = document.createElement('div');
      this.fileEl.classList.add('file-content');
      this.fileEl.setAttribute('data-name', this.file.name);
      this.fileEl.title = `Скачать ${this.file.name}`;
      this.contentEl.append(this.fileEl);

      const fileSymb = document.createElement('i');
      fileSymb.classList.add('far', 'fa-file-alt');
      this.fileEl.append(fileSymb);

      this.fileNameEl = document.createElement('div');
      this.fileNameEl.classList.add('file-name');
      this.fileNameEl.textContent = this.file.name;
      this.fileEl.append(this.fileNameEl);
    }
    if (this.picture) {
      this.pictureEl = document.createElement('img');
      this.pictureEl.classList.add('picture-content');
      this.pictureEl.setAttribute('data-name', this.picture.name);
      this.pictureEl.src = this.picture.src;
      this.pictureEl.title = `Скачать ${this.picture.name}`;
      this.contentEl.append(this.pictureEl);
    }

    const serviceAreaEl = document.createElement('div');
    serviceAreaEl.classList.add('service-area');
    this.element.append(serviceAreaEl);

    this.timeEl = document.createElement('div');
    this.timeEl.classList.add('post-time');
    this.timeEl.textContent = formatDate(this.created_at);
    serviceAreaEl.append(this.timeEl);

    this.pinEl = document.createElement('div');
    this.pinEl.classList.add('pin', 'hidden');
    serviceAreaEl.append(this.pinEl);

    const star = document.createElement('i');
    star.classList.add('fas', 'fa-thumbtack');
    this.pinEl.append(star);


    if (this.coordinates) {
      this.coordsEl.textContent = `[${this.coordinates.lat}, ${this.coordinates.lon}]`;
      this.mapBtn.setAttribute('data-state', 'available');
    } else {
      this.coordsEl.textContent = '[--.------, --.------]';
      eye.classList.remove('fa-eye');
      eye.classList.add('fa-eye-slash');
      this.mapBtn.title = 'Not available';
    }

    // Add event listeners
    this.element.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.element.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    this.pinEl.addEventListener('click', this.onPinClick.bind(this));
    this.mapBtn.addEventListener('click', this.onShowMapClick.bind(this));
    if (this.file) this.fileEl.addEventListener('click', this.onFileClick.bind(this));
    if (this.picture) this.pictureEl.addEventListener('click', this.onPictureClick.bind(this));
    // if (this.coordinates) {
    // }
  }

  // #region Event listeners
  addMouseEnterEventListener(callback) {
    this.mouseEnterEventListeners.push(callback);
  }

  addMouseLeaveEventListener(callback) {
    this.mouseLeaveEventListeners.push(callback);
  }

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

  onMouseEnter() {
    this.mouseEnterEventListeners.forEach((c) => c.call(null, this.id));
  }

  onMouseLeave() {
    this.mouseLeaveEventListeners.forEach((c) => c.call(null, this.id));
  }

  onPinClick() {
    this.pinClickEventListeners.forEach((c) => c.call(null, this.id));
  }

  onShowMapClick() {
    this.showMapClickEventListeners.forEach((c) => c.call(null, this.id));
  }

  onFileClick() {
    this.fileClickEventListeners.forEach((c) => c.call(null, this.id));
  }

  onPictureClick() {
    this.pictureClickEventListeners.forEach((c) => c.call(null, this.id));
  }
  // #endregion

  // #region Pin functions
  showPin() {
    this.pinEl.classList.remove('hidden');
  }

  hidePin() {
    this.pinEl.classList.add('hidden');
  }

  enablePin() {
    this.pinEl.classList.add('enabled');
    this.element.classList.add('pinned');
  }

  disablePin() {
    this.pinEl.classList.remove('enabled');
    this.element.classList.remove('pinned');
  }

  get pinned() {
    return this.pinEl.classList.contains('enabled');
  }
  // #endregion

  remove() {
    this.element.remove();
  }
}
