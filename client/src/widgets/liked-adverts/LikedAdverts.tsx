import React, { useState } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { removeSavedAdvertThunk } from '@features/liked-adverts/model';
import { selectSavedAdverts } from '@entities/advert/model/likedAdvertsSelectors';
import { SavedStatus } from '@entities/advert/model/likedAdvertsModel';
import { getLikedAdvertsThunk } from '@entities/advert/model/likedAdvertsThunk';
import ConfirmDeleteModal from '@features/remove-like/ConfirmDeleteModal';

export default function LikedAdverts({ onOpenAdvert }: {
  onOpenAdvert: (id: number) => void;
}): JSX.Element {
  const dispatch = useAppDispatch();
  const saved = useAppSelector(selectSavedAdverts);
  const { items } = saved;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  return (
    <Box p={4} bg="#F3F3FF" borderRadius="md" h="100%" overflowY="auto">
      <Text fontSize="xl" fontWeight="bold" mb={4}>Избранные объявления</Text>
      {saved.status === SavedStatus.Loading && <Text role="status">Загрузка избранного…</Text>}
      {saved.error && <Box role="alert">{saved.error}<Button onClick={() => { void dispatch(getLikedAdvertsThunk()); }}>Повторить</Button></Box>}
      {saved.status === SavedStatus.Ready && items.length === 0 && <Text>Нет избранных объявлений.</Text>}
      <VStack spacing={3} align="stretch">
        {items.map((item) => (
          <Box key={item.id} p={3} bg="white" borderRadius="md">
            <Button variant="link" onClick={() => onOpenAdvert(item.advertId)}>{item.Advert.title ?? 'Объявление'}</Button>
            <Text>{item.Advert.body}</Text>
            <Text>{item.Advert.price === null ? 'Цена не указана' : `${item.Advert.price} ₽`} — {item.Advert.location?.city ?? 'Город не указан'}</Text>
            <Button mt={2} size="sm" onClick={() => setSelectedId(item.advertId)}>Удалить из избранного</Button>
          </Box>
        ))}
      </VStack>
      <ConfirmDeleteModal
        isOpen={selectedId !== null}
        advertId={selectedId}
        onClose={() => setSelectedId(null)}
        onDeleted={() => setSelectedId(null)}
        onDelete={(id) => dispatch(removeSavedAdvertThunk(id)).unwrap()}
        pending={saved.status !== SavedStatus.Ready || (selectedId !== null && !!saved.pending[selectedId])}
      />
    </Box>
  );
}
