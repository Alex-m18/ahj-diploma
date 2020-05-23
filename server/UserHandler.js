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
    this.filterString = '';
    this.init();
  }

  init() {
    this.io.on('register', this.onRegister.bind(this));
    this.io.on('login', this.onLogin.bind(this));
    this.io.on('logout', this.onLogout.bind(this));
    // this.io.on('getcurrentuser', this.onGetCurrent.bind(this));
    this.io.on('getmessages', this.onGetMessages.bind(this));
    this.io.on('newpost', this.onNewPost.bind(this));
    this.io.on('updatepost', this.onUpdatePost.bind(this));
    this.io.on('filter', this.onFilter.bind(this));
  }

  authorize(cookie) {
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

    this.io.join(this.user.name);

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
    this.filterString = '';
    this.closeSession();
    this.io.emit('logout', { success: true });
    this.io.leaveAll();
    this.userdb = null;
    this.currentSession = null;
    this.user = null;
  }

  // onGetCurrent(data) {
  //   const { id } = data;
  //   let user;
  //   try {
  //     user = this.getAuthorized(id).user;
  //   } catch (e) {
  //     this.io.emit('getcurrentuser', { success: false, error: e.message });
  //     return;
  //   }
  //   delete user.password;
  //   delete user.isAuthorized;
  //   this.io.emit('getcurrentuser', { success: true, user });
  // }

  onGetMessages(data) {
    if (!this.user) {
      this.io.emit('getmessages', { success: false, error: UserHandler.USER_NOT_AUTHORIZED });
      return;
    }

    let startIndex = 0;
    const oldestPostID = data;
    const userPosts = this.filteredPosts;
    if (oldestPostID) {
      startIndex = userPosts.indexOf(userPosts.find((p) => p.id === oldestPostID));
    } else {
      startIndex = userPosts.length - 1;
    }
    startIndex -= UserHandler.MESSAGE_PORTION - 1;
    if (startIndex < 0) startIndex = 0;
    const nextPosts = userPosts.slice(startIndex, startIndex + UserHandler.MESSAGE_PORTION);
    nextPosts.forEach((p) => this.io.emit('newpost', { success: true, post: p }));
    // this.io.emit('messages', { success: true, nextPosts });
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
      fs.mkdir(`${this.pubDir}/${newObj.id}`, () => {
        fs.writeFile(
          `${this.pubDir}/${newObj.id}/${newObj.name}`,
          obj.blob,
          () => console.log(`File '${newObj.name}' saved in ${newObj.id}`),
        );
      });
      return newObj;
    };

    if (audio && audio.blob) newPost.audio = saveFile(audio);
    if (video && video.blob) newPost.video = saveFile(video);
    if (picture && picture.blob) newPost.picture = saveFile(picture);
    if (file && file.blob) newPost.file = saveFile(file);

    this.db.get('posts').push(newPost).write();

    if (this.filteredPosts.indexOf(newPost) > -1) {
      this.io.emit('newpost', { success: true, post: newPost });
    }
    this.io.to(this.user.name).emit('newpost', { success: true, post: newPost });
  }

  onUpdatePost(data) {
    const { id, pinned, favorite } = data;

    const posts = this.db.get('posts').filter({ user_id: this.user.id }).value();
    const post = posts.find((p) => p.id === id);
    if (!post) return;

    if (pinned && !post.pinned) { // ищем старый закрепленный пост и раскрепляем его
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
        this.io.to(this.user.name)
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
    this.io.to(this.user.name)
      .emit('updatepost', {
        success: true,
        post: {
          id: post.id,
          pinned: post.pinned,
          favorite: post.favorite,
        },
      });
  }

  onFilter(data) {
    if (!this.user) {
      this.io.emit('filter', { success: false, error: UserHandler.USER_NOT_AUTHORIZED });
      return;
    }
    this.filterString = data;
    this.onGetMessages();
  }

  get filteredPosts() {
    const str = this.filterString;
    const userPosts = this.db.get('posts').filter({ user_id: this.user.id }).value() || [];
    if (str === '') return userPosts;

    const filters = {
      audio: 'audio',
      video: 'video',
      text: 'text',
      pic: 'picture',
      file: 'file',
      fav: 'favorite',
    };
    let filter;
    let text = str;
    if (str[0] === '@') {
      const firstSpaceIndex = str.indexOf(' ');
      filter = (firstSpaceIndex > -1) ? str.slice(1, firstSpaceIndex) : str.slice(1);
      text = (firstSpaceIndex > -1) ? str.slice(firstSpaceIndex + 1).trim() : '';
    }
    filter = filters[filter];
    let posts = userPosts;

    if (text !== '') {
      posts = posts.filter((p) => {
        if (p.text && p.text.toLowerCase().indexOf(text.toLowerCase()) > -1) return true;
        let result = false;
        ['audio', 'video', 'picture', 'file'].forEach((s) => {
          if (p[s] && p[s].name.toLowerCase().indexOf(text.toLowerCase()) > -1) result = true;
        });
        return result;
      });
    }
    if (filter) posts = posts.filter((p) => p[filter]);
    return posts;
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

UserHandler.MESSAGE_PORTION = 10;

UserHandler.USERNAME_REQUIRE = 'Поле Имя обязательно для заполнения';
UserHandler.PASSWORD_REQUIRE = 'Поле Пароль обязательно для заполнения';
UserHandler.USER_EXISTS = 'Пользователь уже существует';
UserHandler.USER_NOT_FOUND = 'Пользователь не найден';
UserHandler.USER_NOT_AUTHORIZED = 'Пользователь не авторизован';

module.exports = UserHandler;
