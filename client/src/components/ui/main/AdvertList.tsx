import React, { useEffect } from 'react';
import { Flex, Button, Text } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import AdvertCard from './AdvertCard';
import { getFilteredAdvertsThunk } from '../../../redux/slices/adverts/advertsThunk';
import { loadCards } from '../../../redux/slices/adverts/advertsSlice';

export default function AdvertList(): JSX.Element {
  const { adverts, visitableCards, filters } = useAppSelector((state) => state.advert);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Отправляем запрос с фильтрами, когда они изменяются
    void dispatch(getFilteredAdvertsThunk(filters));
    const searchParams = new URLSearchParams(location.search);
    searchParams.forEach((_, key) => searchParams.delete(key));
    searchParams.set('priceFrom', filters.priceFrom);
    searchParams.set('priceTo', filters.priceTo);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  }, [filters, dispatch]);

  const handleLoadMore = (): void => {
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
