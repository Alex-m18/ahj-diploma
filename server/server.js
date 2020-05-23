/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
const http = require('http');
const Koa = require('koa');
const koaStatic = require('koa-static');
// const koaBody = require('koa-body');
const SocketIO = require('socket.io');


const low = require('lowdb');
const setDefaultUser = require('./setDefaultUser');

const FileSync = require('lowdb/adapters/FileSync', {
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});
const db = low(new FileSync('db.json'));
if (!db.get('users').value()) setDefaultUser(db);


const app = new Koa();
app.use(koaStatic('./users_files'));

// Koa body initialize
// app.use(koaBody({
//   urlencoded: true,
// }));

// Preflight
// eslint-disable-next-line consistent-return
app.use(async (ctx, next) => {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  ctx.response.set({ ...headers });

  const origin = ctx.request.get('Origin');
  if (!origin) {
    // eslint-disable-next-line no-return-await
    return await next();
  }

  if (ctx.request.method !== 'OPTIONS') {
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }
  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, DELETE',
    });
    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      );
    }
    ctx.response.status = 204;
  }
});


// Run server
const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
const io = SocketIO(server, { cookie: true });
const UserHandler = require('./UserHandler');

// io.use((socket, next) => {
//   if (socket.request.headers.cookie) return next();
//   next(new Error('Authentication error'));
//   return null;
// });

io.on('connection', (client) => {
  console.log('Client connected');
  client.userHandler = new UserHandler(client, db);


  client.on('message', (data) => { console.log(data); });

  client.on('event', (data) => { console.log(data); });

  client.on('disconnect', () => {
    let str;
    if (client.userHandler && client.userHandler.user) {
      client.leaveAll();
      str = `User '${client.userHandler.user.name}'`;
    } else {
      str = 'Client';
    }
    console.log(`${str} disconnected`);
    try {
      // client.userHandler.logout();
      client.userHandler = null;
    } catch (e) {
      console.log(e.message);
    }
  });
});

server.listen(port);
console.log(`Server is listening on port ${port}`);
