// Manual integration check using synthetic records in the local development database.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { once } = require('node:events');
const sharp = require('sharp');
const WebSocket = require('ws');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const app = require('../build/src/app');
const db = require('../build/db/models');
async function run() {
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${app.address().port}`;
  const saved = {
    users: [],
    adverts: [],
    people: [],
    password: 'SmokeOnly123',
  };
  const sockets = [];
  const request = async (path, method = 'GET', data, person, status = 200) => {
    const headers = person
      ? { Authorization: `Bearer ${person.token}`, Cookie: person.cookie }
      : {};
    if (data && !(data instanceof FormData))
      headers['Content-Type'] = 'application/json';
    const response = await fetch(origin + path, {
      method,
      headers,
      body:
        data instanceof FormData
          ? data
          : data
            ? JSON.stringify(data)
            : undefined,
    });
    const text = await response.text();
    assert.equal(
      response.status,
      status,
      `${method} ${path}: ${text.slice(0, 200)}`,
    );
    return {
      data:
        text && response.headers.get('content-type')?.includes('json')
          ? JSON.parse(text)
          : text,
      cookie: response.headers.get('set-cookie')?.split(';')[0],
    };
  };
  const form = (values) => {
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => data.set(key, value));
    return data;
  };
  const event = (socket, type) =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off('message', listener);
        reject(Error(`Timeout: ${type}`));
      }, 5000);
      const listener = (raw) => {
        const item = JSON.parse(raw.toString());
        if (item.type === type) {
          clearTimeout(timeout);
          socket.off('message', listener);
          resolve(item);
        }
      };
      socket.on('message', listener);
    });
  try {
    const tags = (await request('/api/adverts/tags')).data;
    for (const name of [
      'Для некурящих',
      'Питомцы разрешены',
      'Тихие вечера',
      'С рабочим местом',
    ])
      assert.ok(tags.some((tag) => tag.name === name));
    const people = [];
    for (let i = 0; i < 2; i += 1) {
      const email = `redesign-smoke-${Date.now()}-${i}@example.invalid`;
      const data = form({
        name: `Redesign smoke ${i}`,
        email,
        password: saved.password,
      });
      const signup = await request('/api/auth/signup', 'POST', data);
      saved.users.push(signup.data.user.id);
      saved.people.push({ id: signup.data.user.id, email });
      await fs.writeFile(
        '/tmp/get-sosed-redesign-smoke.json',
        JSON.stringify(saved),
      );
      assert.equal(signup.data.user.UserProfile.photo, null);
      assert.equal(signup.data.user.UserProfile.gender, null);
      assert.deepEqual(signup.data.user.UserProfile.habits, []);
      await request('/api/auth/signup', 'POST', data, undefined, 409);
      const login = await request('/api/auth/login', 'POST', {
        email,
        password: saved.password,
      });
      people.push({
        id: signup.data.user.id,
        token: login.data.accessToken,
        cookie: login.cookie,
      });
    }
    const [a, b] = people;
    const image = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#d4aa66' },
    })
      .png()
      .toBuffer();
    const profile = form({
      name: 'Smoke Updated',
      city: 'Казань',
      intent: 'Ищу соседа',
      about: 'Тестовый профиль новых страниц',
      habits: '["Тихие вечера"]',
      age: '27',
      phoneNumber: '+70000000000',
    });
    profile.set(
      'photo',
      new Blob([image], { type: 'image/png' }),
      'avatar.png',
    );
    const updated = (await request(`/api/users/${a.id}`, 'PATCH', profile, a))
      .data;
    assert.equal(updated.name, 'Smoke Updated');
    assert.equal(updated.UserProfile.city, 'Казань');
    assert.equal(updated.UserProfile.age, 27);
    assert.equal(updated.hashpass, undefined);
    const preserved = (
      await request(
        `/api/users/${a.id}`,
        'PATCH',
        form({ intent: 'Ищу жильё' }),
        a,
      )
    ).data;
    assert.equal(preserved.UserProfile.photo, updated.UserProfile.photo);
    assert.equal(preserved.UserProfile.phoneNumber, '+70000000000');
    assert.equal(
      (await request('/api/tokens/refresh', 'GET', undefined, a)).data.user
        .UserProfile.intent,
      'Ищу жильё',
    );
    await request(
      `/api/users/${a.id}`,
      'PATCH',
      form({ habits: '{}' }),
      a,
      400,
    );
    await request(
      `/api/users/${b.id}`,
      'PATCH',
      form({ city: 'Москва' }),
      a,
      403,
    );
    assert.equal(
      (
        await request(
          `/api/users/${a.id}`,
          'PATCH',
          form({ removePhoto: 'true' }),
          a,
        )
      ).data.UserProfile.photo,
      null,
    );
    const fields = {
      title: 'Redesign smoke listing',
      body: 'Тестовое объявление подключения новых страниц',
      city: 'Казань',
      address: 'Тестовая улица, 1',
      district: 'Центр',
      metro: '',
      price: '25000',
      square: '18',
      rooms: '2',
      floor: '3',
      tagIds: JSON.stringify(tags.slice(0, 2).map((tag) => tag.id)),
    };
    const before = await db.Advert.count({ where: { userId: a.id } });
    await request('/api/adverts', 'POST', form(fields), a, 400);
    const bad = form(fields);
    bad.append('files', new Blob(['broken'], { type: 'image/png' }), 'bad.png');
    await request('/api/adverts', 'POST', bad, a, 400);
    assert.equal(await db.Advert.count({ where: { userId: a.id } }), before);
    const publication = form(fields);
    for (const name of ['main.png', 'second.png'])
      publication.append(
        'files',
        new Blob([image], { type: 'image/png' }),
        name,
      );
    const advert = (await request('/api/adverts', 'POST', publication, a, 201))
      .data;
    saved.adverts.push(advert.id);
    await fs.writeFile(
      '/tmp/get-sosed-redesign-smoke.json',
      JSON.stringify(saved),
    );
    assert.equal(advert.userId, a.id);
    assert.equal(advert.AdvertPhotos.length, 2);
    assert.equal(advert.tags.length, 2);
    assert.equal(advert.location.metro, null);
    assert.ok(advert.AdvertPhotos[0].photo.endsWith('photo-0.webp'));
    assert.deepEqual(
      (await request(`/api/adverts/${advert.id}`)).data.AdvertPhotos,
      advert.AdvertPhotos,
    );
    assert.ok(
      (await request('/api/adverts/mine', 'GET', undefined, a)).data.items.some(
        (item) => item.id === advert.id,
      ),
    );
    assert.equal(
      (await request('/api/adverts/mine', 'GET', undefined, b)).data.total,
      0,
    );
    assert.ok(
      (
        await request('/api/adverts/filters', 'POST', {
          city: 'Казань',
          tags: tags.slice(0, 2),
        })
      ).data.some((item) => item.id === advert.id),
    );
    await request(`/api/likes/${advert.id}`, 'POST', undefined, b, 201);
    await request(`/api/likes/${advert.id}`, 'POST', undefined, b);
    assert.ok(
      (await request('/api/adverts/liked', 'GET', undefined, b)).data.some(
        (item) => item.advertId === advert.id,
      ),
    );
    await request(`/api/likes/${advert.id}`, 'DELETE', undefined, b);
    assert.equal(
      (await request(`/api/likes/${advert.id}`, 'DELETE', undefined, b)).data
        .deleted,
      false,
    );
    await request(`/api/users/${a.id}`, 'GET', undefined, b, 403);
    await request('/api/users/999999999/summary', 'GET', undefined, a, 404);
    assert.equal(
      (await request(`/api/users/${b.id}/summary`, 'GET', undefined, a)).data
        .id,
      b.id,
    );
    const connect = async (person) => {
      const socket = new WebSocket(origin.replace('http:', 'ws:') + '/ws', {
        headers: { Cookie: person.cookie },
      });
      sockets.push(socket);
      await once(socket, 'open');
      return socket;
    };
    const sa = await connect(a);
    const sb = await connect(b);
    let next = event(sa, 'SET_MESSAGES');
    sa.send(
      JSON.stringify({ type: 'INITIALIZE', payload: { receiverId: b.id } }),
    );
    assert.deepEqual((await next).payload, []);
    const sent = event(sa, 'ADD_MESSAGE');
    const received = event(sb, 'ADD_MESSAGE');
    sa.send(
      JSON.stringify({
        type: 'ADD_MESSAGE',
        payload: { receiverId: b.id, text: 'Первое сообщение' },
      }),
    );
    assert.equal((await sent).payload.id, (await received).payload.id);
    next = event(sa, 'ADD_MESSAGE');
    sb.send(
      JSON.stringify({
        type: 'ADD_MESSAGE',
        payload: { receiverId: a.id, text: 'Ответ' },
      }),
    );
    await next;
    const list = (await request(`/api/users/${a.id}`, 'GET', undefined, a))
      .data;
    assert.equal(list.length, 1);
    assert.equal(list[0].message, 'Ответ');
    sb.close();
    await once(sb, 'close');
    next = event(sa, 'ADD_MESSAGE');
    sa.send(
      JSON.stringify({
        type: 'ADD_MESSAGE',
        payload: { receiverId: b.id, text: 'Офлайн' },
      }),
    );
    await next;
    const reconnect = await connect(b);
    next = event(reconnect, 'SET_MESSAGES');
    reconnect.send(
      JSON.stringify({ type: 'INITIALIZE', payload: { receiverId: a.id } }),
    );
    const history = await next;
    assert.equal(history.receiverId, a.id);
    assert.equal(history.payload.length, 3);
    assert.equal(history.payload.at(-1).message, 'Офлайн');
    assert.ok(!JSON.stringify(history).includes('hashpass'));
    await request('/api/auth/logout', 'GET', undefined, b);
    console.log(
      'PASS: live auth/refresh, profile/photo, publish/photos/tags/validation, mine/filter/likes, ownership, two-user WebSocket/offline/reconnect',
    );
  } finally {
    sockets.forEach((socket) => socket.close());
    await new Promise((resolve) => app.close(resolve));
    await db.sequelize.close();
    if (saved.users.length && process.env.KEEP_REDESIGN_SMOKE !== '1') execFileSync(process.execPath, [path.join(__dirname, 'redesign-cleanup.cjs')], { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
  }
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
