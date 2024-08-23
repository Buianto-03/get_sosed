import React from 'react';
import { Flex, Button, Box, Text } from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import AdvertCard from './AdvertCard';
import { loadCards } from '../../../redux/slices/adverts/advertsSlice';
import type { AdvertType } from '../../../types/advert';

// Пример данных с залайканными квартирами
const popularAdverts: AdvertType[] = [
  {
    id: 1,
    title: 'Просторная квартира в центре',
    price: 4500000,
    userId: 1,
    User: {
      id: 1,
      name: 'Иван Иванов',
      email: 'ivan@example.com',
    },
    Location: {
      id: 1,
      city: 'Москва',
      district: 'Центральный',
      address: 'ул. Тверская, д. 7',
      metro: 'Охотный ряд',
      coordinates: 'https://via.placeholder.com/300x140', // URL изображения
      advertId: 1,
    },
  },
  {
    id: 2,
    title: 'Современная квартира на юге города',
    price: 3000000,
    userId: 2,
    User: {
      id: 2,
      name: 'Мария Петрова',
      email: 'maria@example.com',
    },
    Location: {
      id: 2,
      city: 'Москва',
      district: 'Южный',
      address: 'ул. Ленинская, д. 15',
      metro: 'Южная',
      coordinates: 'https://via.placeholder.com/300x140', // URL изображения
      advertId: 2,
    },
  },
  {
    id: 3,
    title: 'Уютная квартира в спальном районе',
    price: 2500000,
    userId: 3,
    User: {
      id: 3,
      name: 'Анна Смирнова',
      email: 'anna@example.com',
    },
    Location: {
      id: 3,
      city: 'Москва',
      district: 'Спальный район',
      address: 'ул. Ленина, д. 3',
      metro: 'Планерная',
      coordinates: 'https://via.placeholder.com/300x140', // URL изображения
      advertId: 3,
    },
  },
  {
    id: 4,
    title: 'Квартира с видом на парк',
    price: 5200000,
    userId: 4,
    User: {
      id: 4,
      name: 'Сергей Кузнецов',
      email: 'sergey@example.com',
    },
    Location: {
      id: 4,
      city: 'Москва',
      district: 'Парк',
      address: 'ул. Парковая, д. 9',
      metro: 'Партизанская',
      coordinates: 'https://via.placeholder.com/300x140', // URL изображения
      advertId: 4,
    },
  },
  {
    id: 5,
    title: 'Элитная квартира в центре',
    price: 7500000,
    userId: 5,
    User: {
      id: 5,
      name: 'Елена Иванова',
      email: 'elena@example.com',
    },
    Location: {
      id: 5,
      city: 'Москва',
      district: 'Центральный',
      address: 'ул. Петровка, д. 25',
      metro: 'Тверская',
      coordinates: 'https://via.placeholder.com/300x140', // URL изображения
      advertId: 5,
    },
  },
  {
    id: 6,
    title: 'Недорогая квартира на окраине',
    price: 2000000,
    userId: 6,
    User: {
      id: 6,
      name: 'Алексей Ковалев',
      email: 'alexey@example.com',
    },
    Location: {
      id: 6,
      city: 'Москва',
      district: 'Окраина',
      address: 'ул. Дальняя, д. 42',
      metro: 'Щелковская',
      coordinates: 'https://via.placeholder.com/300x140', // URL изображения
      advertId: 6,
    },
  },
];

export default function PopularCard(): JSX.Element {
  const adverts = popularAdverts; // Используем моковые данные
  const visitableCards = 4; // Ограничиваем показ карточек

  const dispatch = useAppDispatch();

  const handleLoadMore = () => {
    // Здесь может быть логика для загрузки дополнительных карточек
    // dispatch(loadCards());
  };

  return (
    <Box p={8}>
      {/* Заголовок */}
      <Text fontSize="2xl" fontWeight="bold" mb={4} textAlign="center">
        Сейчас популярно
      </Text>

      {/* Сетка карточек */}
      <Flex direction="row" wrap="wrap" gap={4} justifyContent="center">
        {adverts.slice(0, visitableCards).map((advert) => (
          <AdvertCard key={advert.id} advert={advert} />
        ))}
      </Flex>
    </Box>
  );
}
