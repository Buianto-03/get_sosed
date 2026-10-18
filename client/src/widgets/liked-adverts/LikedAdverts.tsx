import React, { useState } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { getLikedAdvertsThunk } from '@features/liked-adverts/model';
import ConfirmDeleteModal from '@features/remove-like/ConfirmDeleteModal';

export default function LikedAdverts({ onOpenAdvert }: {
  onOpenAdvert: (id: number) => void;
}): JSX.Element {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.likedAdverts.items);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  return (
    <Box p={4} bg="#F3F3FF" borderRadius="md" h="100%" overflowY="auto">
      <Text fontSize="xl" fontWeight="bold" mb={4}>Избранные объявления</Text>
      {items.length === 0 && <Text>Нет избранных объявлений.</Text>}
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
        onDeleted={() => { setSelectedId(null); void dispatch(getLikedAdvertsThunk()); }}
      />
    </Box>
  );
}
