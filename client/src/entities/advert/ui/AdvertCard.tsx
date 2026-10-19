import { Box, Image, Text, IconButton, Flex, Badge, Icon } from '@chakra-ui/react';
import { BiHeart, BiCamera, BiUser } from 'react-icons/bi';
import React from 'react';
import type { AdvertType } from '../model/advertsModel';

interface AdverProps {
  saved: boolean;
  saveDisabled: boolean;
  saveError?: string;
  onSave: () => void;
  advert: AdvertType;
  onOpen: (id: number) => void;
};

export default function AdvertCard({ advert, onOpen, saved, saveDisabled, saveError, onSave }: AdverProps): JSX.Element {
  const handleClick = (): void => {
    onOpen(advert.id);
  };
  return (
    <Box
      width="300px"
      // height="400px"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      position="relative"
      boxShadow="md"
      onClick={handleClick}
      cursor="pointer"
      bg="#fff"
    >
      {/* Image Section */}
      <Box position="relative" height="140px">
        {advert &&
          advert.AdvertPhotos &&
          advert.AdvertPhotos[0] &&
          advert.AdvertPhotos[0].photo && (
          <Image
            src={advert.AdvertPhotos[0].photo}
            alt="Apartment"
            objectFit="cover"
            width="100%"
            height="100%"
          />
        )}

        {/* Like Icon */}
        <IconButton
          aria-label={saved ? 'Убрать из избранного' : 'Сохранить объявление'}
          aria-pressed={saved}
          isDisabled={saveDisabled}
          color={saved ? 'red.500' : undefined}
          onClick={(event) => { event.stopPropagation(); onSave(); }}
          icon={<BiHeart />}
          variant="ghost"
          colorScheme="whiteAlpha"
          position="absolute"
          top="2"
          right="2"
          size="sm"
        />

        {/* Camera Icon */}
        <IconButton
          aria-label="Camera"
          icon={<BiCamera />}
          variant="ghost"
          colorScheme="whiteAlpha"
          position="absolute"
          bottom="2"
          left="2"
          size="sm"
        />
      </Box>

      {/* Content Section */}
      <Box p="2">
        {saveError && <Text role="alert">{saveError}</Text>}
        {/* Price and Details */}
        <Text fontSize="md" fontWeight="bold">
          {advert.price === null ? 'Цена не указана' : `${advert.price.toLocaleString()} ₽`}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {/* Добавим описание квартиры, если это есть */}
          {advert.title ?? 'Объявление'}
        </Text>

        {/* Location and Amenities */}
        <Flex alignItems="center" mt="1">
          <Badge colorScheme="green" mr="1" fontSize="xs">
            {advert.location?.metro}
          </Badge>
          <Flex alignItems="center" color="gray.500" fontSize="xs">
            <Icon as={BiUser} mr="1" />
            <Text>{advert.user?.name ?? 'Автор не указан'}</Text> {/* Показываем имя пользователя */}
          </Flex>
        </Flex>

        {/* Address */}
        <Text mt="1" fontSize="xs" color="gray.500">
          {[advert.location?.address, advert.location?.city, advert.location?.district].filter(Boolean).join(', ') || 'Адрес не указан'}
        </Text>
      </Box>
    </Box>
  );
}
