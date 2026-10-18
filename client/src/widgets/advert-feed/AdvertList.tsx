import React, { useEffect } from 'react';
import { Box, Flex, Button, Text } from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@app/store/hooks';
import { useSavedAdverts } from '@features/liked-adverts/model/use-saved-adverts';
import AdvertCard from '@entities/advert/ui/AdvertCard';
import { getFilteredAdvertsThunk } from '@entities/advert/model/advertsThunk';
import { loadCards } from '@entities/advert/model/advertsSlice';
import { readFilters } from '@features/advert-filter/model/filters';
import { routes } from '@shared/config/routes';

export default function AdvertList(): JSX.Element {
  const { adverts, visitableCards, loading, error } = useAppSelector((state) => state.advert);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const saved = useSavedAdverts();
  const [querySearchParams] = useSearchParams();
  const query = querySearchParams.toString();

  useEffect(() => {
    const { tagIds, ...filters } = readFilters(new URLSearchParams(query));
    void dispatch(getFilteredAdvertsThunk({
      ...filters,
      tags: tagIds.map((id) => ({ id, name: '' })),
    }));
  }, [query, dispatch]);

  const handleLoadMore = (): void => {
    dispatch(loadCards());
  };

  return (
    <>
      <Text fontSize="2xl" fontWeight="bold" mb={4} textAlign="center">
        Фильтр
      </Text>
      {loading && <Text textAlign="center">Загрузка объявлений...</Text>}
      {error && <Text role="alert" color="red.500" textAlign="center">{error}</Text>}
      {saved.error && <Box role="alert">{saved.error}<button type="button" onClick={saved.reload}>Повторить</button></Box>}
      <Flex direction="row" wrap="wrap" gap={4} justifyContent="center" mb={8}>
        {adverts.slice(0, visitableCards).map((advert) => (
          <AdvertCard key={advert.id} advert={advert}
            saved={saved.savedIds.includes(advert.id)}
            saveDisabled={saved.disabled || !!saved.pending[advert.id]}
            saveError={saved.errors[advert.id]}
            onSave={() => saved.toggle(advert)} onOpen={(id) => navigate(routes.listingDetails(id))} />
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
