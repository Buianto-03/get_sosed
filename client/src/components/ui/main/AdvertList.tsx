import React, { useEffect } from 'react';
import { Flex, Button, Text } from '@chakra-ui/react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import AdvertCard from './AdvertCard';
import { getFilteredAdvertsThunk } from '../../../redux/slices/adverts/advertsThunk';
import { loadCards } from '../../../redux/slices/adverts/advertsSlice';
import type { FilterType } from '../../../types/advert';

export default function AdvertList(): JSX.Element {
  const { adverts, visitableCards, filters, pickedTags} = useAppSelector((state) => state.advert);
  const dispatch = useAppDispatch();
  const location = useLocation();
  // const navigate = useNavigate();
  const [querySearchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // dispatch(
    //   setFilters({
    //     city: querySearchParams.get('city') || '',
    //     category: querySearchParams.get('category') || '',
    //     district: querySearchParams.get('district') || '',
    //     metro: querySearchParams.get('metro') || '',
    //     priceFrom: Number(querySearchParams.get('priceFrom') || '0'),
    //     priceTo: Number(querySearchParams.get('priceTo') || '0'),
    //   } as FilterType),
    // );
    const filtersFromQuery: FilterType = {
      city: querySearchParams.get('city') || '',
      // category: querySearchParams.get('category') || '',
      district: querySearchParams.get('district') || '',
      metro: querySearchParams.get('metro') || '',
      priceFrom: Number(querySearchParams.get('priceFrom') || '0'),
      priceTo: Number(querySearchParams.get('priceTo') || '0'),
      roomsFrom: Number(querySearchParams.get('roomsFrom') || '0'),
      roomsTo: Number(querySearchParams.get('roomsTo') || '0'),
    }
    void dispatch(getFilteredAdvertsThunk({...filtersFromQuery, tags: pickedTags}));
  }, [querySearchParams, dispatch, pickedTags]);
  // управляемый инпут сделать и чтобы он сохранялся в редаксе

  // нужно сделать дефолтное значение и исправить чтобы фильтры применялися без обновления страницы

  useEffect(() => {
    // Отправляем запрос с фильтрами, когда они изменяются
    // void dispatch(getFilteredAdvertsThunk({...filters, tags: pickedTags}));
    console.log(filters);
    
    const searchParams = new URLSearchParams(location.search);
    // searchParams.forEach((_, key) => searchParams.delete(key));
    searchParams.set('priceFrom', filters.priceFrom.toString());
    searchParams.set('priceTo', filters.priceTo.toString());
    searchParams.set('city', filters.city);
    // searchParams.set('category', filters.category);
    searchParams.set('district', filters.district);
    searchParams.set('metro', filters.metro);
    searchParams.set('roomsFrom', filters.roomsFrom.toString());
    searchParams.set('roomsTo', filters.roomsTo.toString());

    setSearchParams(searchParams);

    // navigate(`${location.pathname}?${searchParams.toString()}`);
  }, [filters, dispatch, location.search, setSearchParams]);

  const handleLoadMore = (): void => {
    dispatch(loadCards());
  };

  return (
    <>
      <Text fontSize="2xl" fontWeight="bold" mb={4} textAlign="center">
        Фильтр
      </Text>
      <Flex direction="row" wrap="wrap" gap={4} justifyContent="center" mb={8}>
        {adverts.slice(0, visitableCards).map((advert) => (
          <AdvertCard key={advert.id} advert={advert} />
        ))}
      </Flex>
      {visitableCards < adverts.length && (
        <Flex justifyContent="center" mt={4} mb={4}>
          <Button onClick={handleLoadMore} colorScheme="blue">
            Посмотреть еще
          </Button>
        </Flex>
      )}
    </>
  );
}
