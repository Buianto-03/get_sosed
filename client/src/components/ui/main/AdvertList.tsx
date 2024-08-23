import React from 'react';
import { Flex, Button, Text } from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import AdvertCard from './AdvertCard';
import { loadCards } from '../../../redux/slices/adverts/advertsSlice';

export default function AdvertList(): JSX.Element {
  const adverts = useAppSelector((state) => state.advert.adverts);
  const visitableCards = useAppSelector((state) => state.advert.visitableCards);

  const dispatch = useAppDispatch();

  const handleLoadMore = () => {
    dispatch(loadCards());
  };

  return (
    <>
      <Text fontSize="2xl" fontWeight="bold" mb={4} textAlign="center">
        Фильтр
      </Text>
      <Flex direction="row" wrap="wrap" gap={4} justifyContent="center">
        {adverts.slice(0, visitableCards).map((advert) => (
          <AdvertCard key={advert.id} advert={advert} />
        ))}
      </Flex>
      {visitableCards < adverts.length && (
        <Flex justifyContent="center" mt={4}>
          <Button onClick={handleLoadMore} colorScheme="blue">
            Посмотреть еще
          </Button>
        </Flex>
      )}
    </>
  );
}
