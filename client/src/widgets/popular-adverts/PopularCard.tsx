import React, { useEffect } from 'react';
import { Flex, Box, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@app/store/hooks';
import AdvertCard from '@entities/advert/ui/AdvertCard';
import { getTopAdvertsThunk } from '@entities/advert/model/advertsThunk';

export default function PopularCard(): JSX.Element {
  const adverts = useAppSelector(store => store.advert.populars);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    void dispatch(getTopAdvertsThunk());
  }, [dispatch]);

  return (
    <Box p={8}>
      {/* Заголовок */}
      <Text fontSize="2xl" fontWeight="bold" mb={4} textAlign="center">
        Сейчас популярно
      </Text>

      {/* Сетка карточек */}
      <Flex direction="row" wrap="wrap" gap={4} justifyContent="center">
        {adverts.map((advert) => (
          <AdvertCard key={advert.id} advert={advert} onOpen={(id) => navigate(`/advert/${id}`)} />
        ))}
      </Flex>
    </Box>
  );
}
