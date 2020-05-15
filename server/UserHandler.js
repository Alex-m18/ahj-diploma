/* eslint-disable no-console */
const uuid = require('uuid').v4;
const fs = require('fs');

class UserHandler {
  constructor(socket, database, pubDir = './users_files') {
    this.io = socket;
    this.db = database;
    this.pubDir = pubDir;
    this.userdb = null;
    this.user = null;
    this.currentSession = null;
    this.init();
  }

  init() {
    this.io.on('register', this.onRegister.bind(this));
    this.io.on('login', this.onLogin.bind(this));
    this.io.on('logout', this.onLogout.bind(this));
    this.io.on('getcurrentuser', this.onGetCurrent.bind(this));
    this.io.on('getmessages', this.onGetMessages.bind(this));
    this.io.on('newpost', this.onNewPost.bind(this));
    this.io.on('updatepost', this.onUpdatePost.bind(this));

    // this.authorize();
  }

  authorize(cookie) {
    // const { cookie } = this.io.request.headers;
    // console.log(this.io.request.headers);
    // console.log(this.io.handshake.headers);
    // const { cookie } = this.io.handshake.headers;
    if (!cookie) return false;
    const sessionIDCookie = cookie.split(';')
      .find((item) => item.trim().startsWith('sessionID='));
    if (!sessionIDCookie) return false;
    const sessionID = sessionIDCookie.split('=')[1];
    if (!sessionID) return false;
    const userdb = this.db.get('users').find(
      (u) => u.sessions.find((s) => s.id === sessionID && Date.parse(s.expires) > Date.now()),
    );
    const user = userdb.value();
    if (!user) return false;

    this.userdb = userdb;
    this.user = user;
    this.currentSession = this.user.sessions.find((s) => s.id === sessionID);
    this.currentSession.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    this.db.write();
    const { name, id } = this.user;
    this.io.emit('login', { success: true, user: { name, id, session: this.currentSession } });

    this.io.join(this.currentSession.id);

    console.log(`User '${user.name}' authorized`);
    return true;
  }

  onRegister(data) {
    console.log(data);
    const { name, password } = data;
    const error = {};
    if (name === '') error.name = UserHandler.USERNAME_REQUIRE;
    if (password === '') error.password = UserHandler.PASSWORD_REQUIRE;

    if (JSON.stringify(error) !== '{}') {
      this.io.emit('register', { success: false, error });
      return;
    }

    const foundUser = this.db.get('users').find({ name }).value();

    if (foundUser) {
      this.io.emit('register', { success: false, error: { name: UserHandler.USER_EXISTS } });
      return;
    }

    this.user = {
      name,
      password,
      id: uuid(),
      isAuthorized: true,
      sessions: [],
    };
    this.userdb = this.db.get('users').push(this.user).write();
    this.userdb = this.userdb[this.userdb.length - 1];

    const { id } = this.user;
    this.storeSession();
    this.io.emit('login', { success: true, user: { name, id, session: this.currentSession } });
    console.log(`User '${name}' registered`);
  }

  onLogin(data) {
    // console.log(data);
    const { name, password, cookie } = data;
    if (cookie && this.authorize(cookie)) return;
    const userdb = this.db.get('users').find({ name, password });
    const user = userdb.value();
    if (this.user && this.user.id === user.id) {
      this.io.emit('login', { success: true, user: { name, id: user.id, session: this.currentSession } });
      console.log(`User '${user.name}' signed in already`);
      return;
    }
    if (!user) {
      this.io.emit('login', {
        success: false,
        error: 'Неверное имя или пароль',
      });
      return;
    }

    if (this.user) this.onLogout();
    this.userdb = userdb;
    this.user = user;
    const { id } = this.user;
    this.storeSession();
    this.io.emit('login', { success: true, user: { name, id, session: this.currentSession } });
    console.log(`User '${user.name}' signed in`);
  }

  storeSession() {
    this.currentSession = {
      id: this.io.id,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    this.user.sessions.push(this.currentSession);
    this.db.write();
  }

  closeSession() {
    // this.user.sessions
    //   .find((s) => s.id === this.currentSession)
    //   .expires = new Date();
    this.currentSession.expires = new Date();
    this.db.write();
  }

  onLogout() {
    console.log('Logout');
    if (!this.user) {
      this.io.emit('logout', { success: false, error: UserHandler.USER_NOT_AUTHORIZED });
      return;
    }
    console.log(`User '${this.user.name}' signed out`);
    this.closeSession();
    this.user = null;
    this.userdb = null;
    this.io.to(this.currentSession.id).emit('logout', { success: true });
    this.io.emit('logout', { success: true });
    this.currentSession = null;
  }

  onGetCurrent(data) {
    const { id } = data;
    let user;
    try {
      user = this.getAuthorized(id).user;
    } catch (e) {
      this.io.emit('getcurrentuser', { success: false, error: e.message });
      return;
    }
    delete user.password;
    delete user.isAuthorized;
    this.io.emit('getcurrentuser', { success: true, user });
  }

  onGetMessages() {
    if (!this.user) {
      this.io.emit('getmessages', { success: false, error: UserHandler.USER_NOT_AUTHORIZED });
    }

    const posts = this.db.get('posts').filter({ user_id: this.user.id }).value();
    this.io.emit('messages', { success: true, posts });
  }

  onNewPost(data) {
    if (!this.user) return;
    const {
      text,
      coordinates,
      audio,
      video,
      picture,
      file,
      pinned,
      favorite,
    } = data;

    const newPost = {
      id: uuid(),
      user_id: this.user.id,
      created_at: new Date(),
      pinned: pinned || false,
      favorite: favorite || false,
    };

    if (coordinates) {
      const { lat, lon } = coordinates;
      if (lat && lon) newPost.coordinates = { lat, lon };
    }

    if (text) newPost.text = text;

    const saveFile = (obj) => {
      const newObj = {};
      newObj.id = uuid();
      newObj.name = obj.name || `Noname_${Date.now()}`;
      fs.writeFile(
        `${this.pubDir}/${newObj.id}`,
        obj.blob,
        () => console.log(`File '${newObj.name}' saved as ${newObj.id}`),
      );
      return newObj;
    };

    if (audio && audio.blob) newPost.audio = saveFile(audio);
    if (video && video.blob) newPost.video = saveFile(video);
    if (picture && picture.blob) newPost.picture = saveFile(picture);
    if (file && file.blob) newPost.file = saveFile(file);

    this.db.get('posts').push(newPost).write();
    this.io.emit('newpost', { success: true, post: newPost });
    this.io.to(this.currentSession.id).emit('newpost', { success: true, post: newPost });
  }

  onUpdatePost(data) {
    const { id, pinned, favorite } = data;

    const posts = this.db.get('posts').filter({ user_id: this.user.id }).value();
    const post = posts.find((p) => p.id === id);
    if (!post) return;

    if (pinned) {
      const pinnedPost = posts.find((p) => p.pinned);
      if (pinnedPost) {
        pinnedPost.pinned = false;
        this.io
          .emit('updatepost', {
            success: true,
            post: {
              id: pinnedPost.id,
              pinned: pinnedPost.pinned,
              favorite: pinnedPost.favorite,
            },
          });
        this.io.to(this.currentSession.id)
          .emit('updatepost', {
            success: true,
            post: {
              id: pinnedPost.id,
              pinned: pinnedPost.pinned,
              favorite: pinnedPost.favorite,
            },
          });
      }
    }
    post.pinned = pinned || false;
    post.favorite = favorite || false;
    this.db.write();

    this.io
      .emit('updatepost', {
        success: true,
        post: {
          id: post.id,
          pinned: post.pinned,
          favorite: post.favorite,
        },
      });
    this.io.to(this.currentSession.id)
      .emit('updatepost', {
        success: true,
        post: {
          id: post.id,
          pinned: post.pinned,
          favorite: post.favorite,
        },
      });
  }

  get(id) {
    const userdb = this.db.get('users').find({ id });
    const user = userdb.value();
    if (!user) throw new Error(UserHandler.USER_NOT_FOUND);
    return { user, userdb };
  }

  getAuthorized(id) {
    const { user, userdb } = this.get(id);
    if (!user.isAuthorized) throw new Error(UserHandler.USER_NOT_AUTHORIZED);
    return { user, userdb };
  }
}

UserHandler.USERNAME_REQUIRE = 'Поле Имя обязательно для заполнения';
UserHandler.PASSWORD_REQUIRE = 'Поле Пароль обязательно для заполнения';
UserHandler.USER_EXISTS = 'Пользователь уже существует';
UserHandler.USER_NOT_FOUND = 'Пользователь не найден';
UserHandler.USER_NOT_AUTHORIZED = 'Пользователь не авторизован';

module.exports = UserHandler;
