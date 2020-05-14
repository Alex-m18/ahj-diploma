import SocketIO from 'socket.io-client';

export default class API {
  constructor(url) {
    this.url = url;
    this.io = null;
    this.connected = false;
    this.authorized = false;
    this.onLoginListener = null;

    this.init();
  }

  init() {
    this.io = new SocketIO(this.url);

    this.io.on('connect', () => {
      this.connected = true;
    });

    this.io.on('login', (data) => {
      if (this.onLoginListener) this.onLoginListener.call(null, data);
    });
  }

  login(data) {
    if (this.connected) this.io.emit('login', data);
  }
}
