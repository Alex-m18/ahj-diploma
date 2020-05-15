// import API from './API';
import SocketIO from 'socket.io-client';
import ChaosOrganizerWidget from './ChaosOrganizerWidget';
import CoordinatesForm from './CoordinatesForm';
import LoginForm from './LoginForm';

export default class ChaosOrganizer {
  constructor(url) {
    this.url = url;
    // this.api = null;
    this.connected = false;
    this.authorized = false;

    this.widget = null;
    this.io = null;
    this.user = null;
    this.loginForm = null;
    this.posts = [];
  }

  async init() {
    this.loginForm = new LoginForm(document.body);
    this.loginForm.init();

    this.coordinatesForm = new CoordinatesForm(document.body);
    this.coordinatesForm.init();

    // Create cookie if not exists
    const sessionIDCookie = document.cookie.split(';')
      .find((item) => item.trim().startsWith('sessionID='));
    if (!sessionIDCookie) document.cookie = 'sessionID=0';

    // this.api = new API(this.url);

    // const options = {
    //   transportOptions: {
    //     polling: {
    //       extraHeaders: {
    //         cookie: document.cookie,
    //       },
    //     },
    //   },
    // };
    this.io = new SocketIO(this.url);

    this.io.on('connect', () => {
      setTimeout(() => {
        if (!this.authorized) this.onLogout({ success: true });
      }, 1000);
      this.connected = true;
    });
    this.io.on('disconnect', () => { this.connected = false; });
    this.io.on('register', this.onRegister.bind(this));
    this.io.on('login', this.onLogin.bind(this));
    this.io.on('logout', this.onLogout.bind(this));
    this.io.on('messages', this.onMessagesRecieved.bind(this));
    this.io.on('newpost', this.onNewPostRecieved.bind(this));
    this.io.on('updatepost', this.onUpdatePostRecieved.bind(this));

    this.io.on('error', (data) => {
      console.log(data);
    });

    this.login();
  }

  login(data = {}) {
    const d = data;
    d.cookie = document.cookie;
    this.io.emit('login', d);
  }

  onRegister(data) {
    if (!data.success) {
      if (!this.loginForm.hidden) alert(data.error.name);
      // return;
    }
  }

  onLogin(data) {
    if (!data.success) {
      if (!this.loginForm.hidden) alert(data.error);
      return;
    }

    const { id, expires } = data.user.session;
    document.cookie = `sessionID=${id}; expires=${expires}`;
    this.authorized = true;
    this.user = data.user;

    this.loginForm.hide();
    this.initWidget();
    this.requestMessages();
  }

  initWidget() {
    if (this.widget) this.widget.unbindFromDOM();
    this.widget = new ChaosOrganizerWidget();
    this.widget.bindToDOM(document.querySelector('#chaos-container'));
    this.widget.init();
    this.widget.setUserName(this.user.name);

    // Add event listeners
    this.widget.addPostCreatedEventListener(this.onPostCreated.bind(this));
    this.widget.addLogoutClickEventListener(this.logout.bind(this));
    this.widget.addPinClickEventListener(this.onPostPinClick.bind(this));
    this.widget.addFileClickEventListener(this.onFileClick.bind(this));
    this.widget.addPictureClickEventListener(this.onPictureClick.bind(this));
    this.widget.addShowMapClickEventListener(this.onShowMapClick.bind(this));
  }

  logout() {
    this.io.emit('logout');
  }

  onLogout(data) {
    if (!data.success) return;
    this.authorized = false;
    if (this.widget) this.widget.unbindFromDOM();
    this.loginForm.show(
      this.login.bind(this),
      this.register.bind(this),
      (f) => f, // TODO: написать окошко с сообщением, что нужно войти или зарегистрироваться
    );
  }

  register(data) {
    this.io.emit('register', data);
  }

  requestMessages() {
    this.io.emit('getmessages');
  }

  onMessagesRecieved(data) {
    const { success, posts } = data;
    if (!success) return;

    this.posts = posts.map((post) => this.preparePost(post));
    this.widget.update(this.posts);
  }

  onNewPostRecieved(data) {
    const { success, post } = data;
    if (!success) return;

    const newPost = this.preparePost(post);

    this.posts.push(newPost);
    this.widget.addPost(newPost);
    this.widget.scrollDown();
  }

  onUpdatePostRecieved(data) {
    const { success, post } = data;
    if (!success || !post) return;

    const changedPost = this.getPost(post.id);

    changedPost.pinned = post.pinned;
    changedPost.favorite = post.favorite;

    if (changedPost.pinned) {
      this.widget.pinPost(changedPost.id);
    } else {
      this.widget.unpinPost(changedPost.id);
    }
  }

  preparePost(post) {
    const newPost = post;
    if (newPost.audio) newPost.audio.src = `${this.url}/${newPost.audio.id}`;
    if (newPost.video) newPost.video.src = `${this.url}/${newPost.video.id}`;
    if (newPost.picture) newPost.picture.src = `${this.url}/${newPost.picture.id}`;
    if (newPost.file) newPost.file.src = `${this.url}/${newPost.file.id}`;
    return newPost;
  }

  onPostCreated(post) {
    this.io.emit('newpost', post);
  }

  onPostPinClick(id) {
    const post = this.getPost(id);
    this.io.emit('updatepost', { id, pinned: !post.pinned });
  }

  onFileClick(id) {
    const post = this.getPost(id);
    window.open(post.file.src);
  }

  onPictureClick(id) {
    const post = this.getPost(id);
    window.open(post.picture.src, '_blank').focus();
  }

  getPost(id) {
    return this.posts.find((p) => p.id === id);
  }

  onShowMapClick(id) {
    const post = this.post(id);
    window.open(
      `http://maps.yandex.ru/?text=${post.coordinates.lat},${post.coordinates.lon}`,
      '_blank',
    );
  }
}
