export type PreviewAdvert = {
  id: string;
  title: string;
  price: number;
  city: string;
  district: string;
  metro: string;
  image: string;
  imageAlt: string;
  tags: string[];
  rooms: number;
  area: number;
  floor: number;
  author: string;
  description: string;
};

export const previewAdverts: PreviewAdvert[] = [
  {
    id: 'park',
    title: 'Светлая квартира рядом с парком',
    price: 25000,
    city: 'Москва',
    district: 'Аэропорт',
    metro: 'м. Сокол',
    image: '/images/2pic.jpg',
    imageAlt: 'Гостиная в квартире',
    tags: ['Для некурящих', 'Тихие вечера'],
    rooms: 2,
    area: 54,
    floor: 5,
    author: 'Анна',
    description:
      'Объявление о жилье для совместного проживания. Подробности и условия уточняйте у автора.',
  },
  {
    id: 'kitchen',
    title: 'Квартира с просторной кухней',
    price: 30000,
    city: 'Москва',
    district: 'Сокол',
    metro: 'м. Аэропорт',
    image: '/images/1pic.jpg',
    imageAlt: 'Кухня в квартире',
    tags: ['Питомцы разрешены', 'С рабочим местом'],
    rooms: 3,
    area: 68,
    floor: 4,
    author: 'Михаил',
    description:
      'Просторная квартира с отдельной кухней. В объявлении указаны основные условия проживания.',
  },
  {
    id: 'center',
    title: 'Жильё недалеко от центра',
    price: 22000,
    city: 'Санкт-Петербург',
    district: 'Петроградский',
    metro: 'м. Петроградская',
    image: '/images/kvartira-moskva-bratskaya-ulica-2249903312-1.jpg',
    imageAlt: 'Интерьер квартиры',
    tags: ['Для некурящих'],
    rooms: 2,
    area: 48,
    floor: 3,
    author: 'Ирина',
    description:
      'Уютное жильё для совместной аренды. Можно обсудить детали и познакомиться до заселения.',
  },
];

export const longAdvert: PreviewAdvert = {
  ...previewAdverts[0],
  id: 'long',
  title:
    'Очень длинное название объявления о светлой квартире рядом с парком и несколькими станциями метро',
  district: 'Сокол — район Аэропорт',
  description:
    'Подробное описание жилья для проверки переноса текста в карточках и на странице объявления. Здесь можно указать особенности планировки, правила совместного проживания, наличие мебели и техники, а также договорённости, которые автор предлагает обсудить до просмотра. Текст остаётся демонстрационным и не отправляется на сервер.',
};

export const noPhotoAdvert: PreviewAdvert = {
  ...previewAdverts[0],
  id: 'no-photo',
  image: '',
  imageAlt: '',
};

export const previewConversations = [
  {
    id: 'anna',
    name: 'Анна',
    advert: 'Светлая квартира рядом с парком',
    lastMessage: 'Здравствуйте! Могу рассказать подробнее.',
    time: '12:42',
    messages: [
      { id: 'm1', from: 'them' as const, text: 'Здравствуйте! Спасибо за интерес к объявлению.' },
      { id: 'm2', from: 'me' as const, text: 'Добрый день! Можно узнать подробнее об условиях?' },
      { id: 'm3', from: 'them' as const, text: 'Да, конечно. Давайте договоримся о просмотре.' },
    ],
  },
  {
    id: 'mikhail',
    name: 'Михаил',
    advert: 'Квартира с просторной кухней',
    lastMessage: 'Вам удобно посмотреть квартиру в выходные?',
    time: 'Вчера',
    messages: [{ id: 'm4', from: 'them' as const, text: 'Вам удобно посмотреть квартиру в выходные?' }],
  },
];

export const longMessage =
  'Спасибо за подробности! Мне подходит район и условия. Расскажите, пожалуйста, когда можно посмотреть квартиру и какие документы понадобятся для оформления. Я могу подъехать в будний день после работы или в выходные.';

export const profileFixture = {
  name: 'Александр Петров',
  city: 'Москва',
  about: 'Ищу спокойное жильё рядом с метро. Работаю из дома, ценю порядок и уважение к личному пространству.',
  tags: ['Не курю', 'Без животных', 'Работаю из дома'],
  favorites: previewAdverts.slice(0, 2),
  myAdverts: [previewAdverts[2]],
};

export const postFixture = {
  district: 'Сокол', address: 'Ленинградский проспект, 1', rooms: '2', floor: '3',
  title: 'Светлая комната в квартире у парка',
  city: 'Москва',
  metro: 'Сокол',
  area: '18',
  price: '25000',
  description:
    'Ищу соседа для совместной аренды. В квартире есть всё необходимое, рядом парк и метро.',
};
