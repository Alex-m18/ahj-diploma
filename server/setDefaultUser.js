function setDefaultUser(database) {
  database.defaults({
    users: [
      {
        name: 'demo',
        password: 'demo',
        id: '1',
        sessions: [],
      },
    ],
    posts: [
      {
        id: '1',
        user_id: '1',
        created_at: '2020-04-15 10:24:02',
        text: 'Мои филосовские цитаты мыслителей иногда оказываются совсем не цитатами',
        coordinates: { lat: 51.50851, lon: -0.12572 },
      },
      {
        id: '2',
        user_id: '1',
        created_at: '2020-04-16 16:24:02',
        text: 'НЛО прилетело и оставило эту запись здесь',
        coordinates: { lat: 37.238017, lon: -115.807157 },
      },
      {
        id: '3',
        user_id: '1',
        created_at: '2020-04-16 16:54:02',
        picture: { name: 'regexp.jpg', id: '1' },
        coordinates: { lat: 51.50851, lon: -0.12572 },
      },
      {
        id: '4',
        user_id: '1',
        created_at: '2020-04-16 16:54:02',
        file: { name: 'Easter egg ;).txt', id: '2' },
        coordinates: { lat: 51.50851, lon: -0.12572 },
      },
      // {
      //   id: "5",
      //   user_id: "1",
      //   created_at: "2020-04-16 16:54:02",
      //   video: { name: 'lesson.webm', id: '3' },
      //   coordinates: { lat: 51.50851, lon: -0.12572 },
      // },
      // {
      //   id: "6",
      //   user_id: "1",
      //   created_at: "2020-04-16 16:54:02",
      //   audio: { name: 'song.mp3', id: '4' },
      //   coordinates: { lat: 51.50851, lon: -0.12572 },
      // },
    ],
  }).write();
}

module.exports = setDefaultUser;
