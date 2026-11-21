const fixtureSizes = {
  small: { adverts: 100, tags: 20, saved: 50, history: 100 },
  large: { adverts: 1000, tags: 200, saved: 500, history: 5000 },
};
const signedInUserId = 1;
const activeReceiverId = 2;
const neighborId = 3;
const conversationCount = 50;
const likeDelayMs = 150;
const epoch = Date.UTC(2024, 0, 1);
const primaryTags = ['Для некурящих', 'Питомцы разрешены', 'Тихие вечера', 'С рабочим местом'];

function numbered(count, generate) {
  return Array.from({ length: count }, (_, index) => generate(index + 1));
}

function timestamp(index) {
  return new Date(epoch + index * 60_000).toISOString();
}

function result(data, status = 200) {
  return { status, data };
}

function matchesFilters(advert, filters) {
  const { location, price, rooms, tags } = advert;
  return (
    (!filters.city || filters.city === location.city) &&
    (!filters.district || filters.district === location.district) &&
    (!filters.metro || filters.metro === location.metro) &&
    (!filters.priceFrom || price >= filters.priceFrom) &&
    (!filters.priceTo || price <= filters.priceTo) &&
    (!filters.roomsFrom || rooms >= filters.roomsFrom) &&
    (!filters.roomsTo || rooms <= filters.roomsTo) &&
    (filters.tags ?? []).every(({ id }) => tags.some((tag) => tag.id === id))
  );
}

function readPageNumber(searchParams, key, fallback, max = Number.MAX_SAFE_INTEGER) {
  const value = Number(searchParams.get(key) ?? fallback);
  return Number.isSafeInteger(value) && value > 0 ? Math.min(value, max) : fallback;
}

export function createFixture(size) {
  if (size !== 'small' && size !== 'large') {
    throw new Error(`Unknown optimization fixture size: ${size}`);
  }

  const counts = fixtureSizes[size];
  const signedInUser = {
    id: signedInUserId,
    name: 'Тестовый пользователь',
    email: 'profile@example.invalid',
    roleId: 1,
    UserProfile: {
      about: 'Синтетический профиль для замеров интерфейса.',
      city: 'Москва',
      intent: null,
      habits: ['Тихие вечера'],
      age: 30,
      gender: null,
      photo: null,
      phoneNumber: null,
    },
    UserPhotos: [],
  };
  const participants = new Map([
    [signedInUserId, { id: signedInUserId, name: signedInUser.name, UserProfile: { photo: null } }],
    ...numbered(conversationCount, (index) => {
      const id = index + 1;
      return [id, { id, name: `Тестовый собеседник ${id}`, UserProfile: { photo: null } }];
    }),
  ]);
  const tags = numbered(counts.tags, (id) => ({
    id,
    name: primaryTags[id - 1] ?? `Тестовое условие ${id}`,
  }));
  const adverts = numbered(counts.adverts, (id) => {
    const ownerId = id % 4 === 0 ? signedInUserId : 2 + ((id - 1) % conversationCount);
    return {
      id,
      title: `Тестовое объявление ${id}`,
      body: `Синтетическое описание жилья ${id} для замеров интерфейса.`,
      price: 20_000 + (id % 50) * 1000,
      userId: ownerId,
      floor: 1 + (id % 9),
      rooms: 1 + (id % 4),
      square: 30 + (id % 60),
      createdAt: timestamp(id),
      updatedAt: timestamp(id),
      user: {
        id: ownerId,
        name: participants.get(ownerId).name,
        email: `user-${ownerId}@example.invalid`,
      },
      location: {
        id,
        city: id % 3 === 0 ? 'Казань' : 'Москва',
        district: `Тестовый район ${1 + (id % 8)}`,
        address: `Тестовый адрес ${id}`,
        metro: `Тестовая станция ${1 + (id % 12)}`,
        coordinates: null,
        advertId: id,
      },
      tags: [tags[id % primaryTags.length], tags[(id + primaryTags.length) % tags.length]],
      AdvertPhotos: [],
    };
  });
  const myAdverts = adverts.filter(({ userId }) => userId === signedInUserId).reverse();
  const liked = new Map(
    numbered(counts.saved, (id) => [id * 2, { id, advertId: id * 2, userId: signedInUserId }]),
  );
  let nextLikeId = counts.saved + 1;

  function message(id, senderId, receiverId, text) {
    return {
      id,
      senderId,
      receiverId,
      message: text,
      createdAt: timestamp(id),
      sender: participants.get(senderId),
      receiver: participants.get(receiverId),
    };
  }

  function initialMessage(otherId, index) {
    const id = (otherId - activeReceiverId) * counts.history + index;
    const activeHistory = otherId === activeReceiverId;
    const preview = index === counts.history;
    const outgoing = index % 2 === 0 && (activeHistory || !preview);
    const text = activeHistory
      ? `Тестовое сообщение ${index}`
      : `Сообщение диалога ${otherId}${preview ? '' : ` № ${index}`}`;
    return message(
      id,
      outgoing ? signedInUserId : otherId,
      outgoing ? otherId : signedInUserId,
      text,
    );
  }

  const conversations = new Map(
    numbered(conversationCount, (index) => {
      const otherId = signedInUserId + index;
      return [otherId, { preview: initialMessage(otherId, counts.history), received: [] }];
    }),
  );
  let nextMessageId = counts.history * conversationCount + 1;
  const sockets = new Set();
  let neighborOnline = false;

  function send(socket, packet) {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(packet));
    }
  }

  function broadcast(packet) {
    for (const socket of sockets) {
      send(socket, packet);
    }
  }

  function broadcastPresence() {
    const onlineIds = [signedInUserId, activeReceiverId];
    if (neighborOnline) {
      onlineIds.push(neighborId);
    }
    const payload = onlineIds.map((id) => ({ id, name: participants.get(id).name }));
    broadcast({ type: 'SET_USERS', payload });
  }

  function appendMessage(otherId, senderId, receiverId, text) {
    const entry = message(nextMessageId, senderId, receiverId, text);
    nextMessageId += 1;
    conversations.get(otherId).received.push(entry);
    return entry;
  }

  function connect(socket) {
    sockets.add(socket);
    const cleanup = () => sockets.delete(socket);
    socket.on('close', cleanup);
    socket.on('error', cleanup);
    socket.on('message', (raw) => {
      let receiverId = 0;
      try {
        const { type, payload } = JSON.parse(raw.toString());
        receiverId = payload?.receiverId ?? 0;
        const conversation = conversations.get(receiverId);
        if (!conversation) {
          throw new Error('Unknown fixture receiver');
        }

        if (type === 'INITIALIZE' || type === 'GET_HISTORY_PAGE') {
          const history = numbered(counts.history - 1, (index) =>
            initialMessage(receiverId, index),
          );
          history.push(conversation.preview, ...conversation.received);
          if (type === 'INITIALIZE') {
            send(socket, { type: 'SET_MESSAGES', receiverId, payload: history });
          } else {
            const { requestId, limit = 50, beforeId, afterId } = payload;
            const ascending = afterId !== undefined;
            const candidates = history.filter(({ id }) => {
              if (ascending) {
                return id > afterId;
              }
              return beforeId === undefined || id < beforeId;
            });
            const messages = ascending ? candidates.slice(0, limit) : candidates.slice(-limit);
            const hasMore = candidates.length > limit;
            send(socket, {
              type: 'HISTORY_PAGE',
              requestId,
              receiverId,
              payload: messages,
              hasMore,
              nextCursor: hasMore ? (ascending ? messages.at(-1).id : messages[0].id) : null,
            });
          }
        } else if (type === 'ADD_MESSAGE') {
          const text = payload.text?.trim();
          if (!text || payload.text.length > 10_000) {
            throw new Error('Invalid fixture message');
          }
          const entry = appendMessage(receiverId, signedInUserId, receiverId, text);
          broadcast({ type: 'ADD_MESSAGE', payload: entry });
        }
      } catch {
        send(socket, {
          type: 'CHAT_ERROR',
          receiverId: Number.isSafeInteger(receiverId) ? receiverId : 0,
          payload: 'Не удалось выполнить запрос чата.',
        });
      }
    });
    broadcastPresence();
  }

  function neighbor() {
    const entry = appendMessage(
      neighborId,
      neighborId,
      signedInUserId,
      'Новое сообщение соседнего диалога',
    );
    broadcast({ type: 'NEW_MESSAGE', payload: entry });
  }

  function disconnectWithQueuedMessages(count) {
    for (const socket of sockets) {
      socket.close();
    }
    for (let index = 1; index <= count; index += 1) {
      appendMessage(
        activeReceiverId,
        activeReceiverId,
        signedInUserId,
        `Сообщение вне сети ${index}`,
      );
    }
  }

  function presence() {
    neighborOnline = !neighborOnline;
    broadcastPresence();
  }

  function request(method, pathname, searchParams = new URLSearchParams(), body = {}) {
    switch (`${method} ${pathname}`) {
      case 'GET /api/tokens/refresh':
        return result({ accessToken: 'synthetic-profile-token', user: signedInUser });
      case 'GET /api/adverts':
        return result(adverts);
      case 'GET /api/adverts/top':
        return result([...liked.keys()].slice(0, 4).map((id) => adverts[id - 1]));
      case 'POST /api/adverts/filters':
        return result(adverts.filter((advert) => matchesFilters(advert, body)));
      case 'GET /api/adverts/tags': {
        const query = (searchParams.get('query') ?? '').toLowerCase();
        return result(tags.filter(({ name }) => name.toLowerCase().includes(query)));
      }
      case 'GET /api/adverts/mine': {
        const page = readPageNumber(searchParams, 'page', 1);
        const limit = readPageNumber(searchParams, 'limit', 12, 50);
        const offset = (page - 1) * limit;
        return result({
          items: myAdverts.slice(offset, offset + limit),
          total: myAdverts.length,
          page,
          limit,
        });
      }
      case 'GET /api/adverts/liked':
        return result(
          [...liked.values()].map((like) => ({ ...like, Advert: adverts[like.advertId - 1] })),
        );
      case `GET /api/users/${signedInUserId}`:
        return result(
          [...conversations.values()]
            .map(({ preview, received }) => received.at(-1) ?? preview)
            .sort((a, b) => b.id - a.id),
        );
      default:
        break;
    }

    const summaryMatch = pathname.match(/^\/api\/users\/([1-9]\d*)\/summary$/);
    if (method === 'GET' && summaryMatch) {
      const participant = participants.get(Number(summaryMatch[1]));
      return participant ? result(participant) : result({ error: 'Fixture user not found' }, 404);
    }

    const advertMatch = pathname.match(/^\/api\/adverts\/([1-9]\d*)$/);
    if (method === 'GET' && advertMatch) {
      const advert = adverts[Number(advertMatch[1]) - 1];
      return advert ? result(advert) : result({ error: 'Fixture advert not found' }, 404);
    }

    const likeMatch = pathname.match(/^\/api\/likes\/([1-9]\d*)$/);
    if (likeMatch) {
      const advertId = Number(likeMatch[1]);
      const existing = liked.get(advertId);
      if (!adverts[advertId - 1]) {
        return result({ error: 'Fixture advert not found' }, 404);
      }
      if (method === 'GET') {
        return result(existing ? [existing] : []);
      }
      if (method === 'POST') {
        const like = existing ?? { id: nextLikeId++, advertId, userId: signedInUserId };
        liked.set(advertId, like);
        return { ...result(like, existing ? 200 : 201), delayMs: likeDelayMs };
      }
      if (method === 'DELETE') {
        return {
          ...result({ advertId, deleted: liked.delete(advertId) }),
          delayMs: likeDelayMs,
        };
      }
    }

    return result({ error: `Unhandled fixture request ${method} ${pathname}` }, 404);
  }

  return { request, connect, neighbor, presence, disconnectWithQueuedMessages };
}
