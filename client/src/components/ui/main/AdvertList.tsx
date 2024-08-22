import React from 'react';
import { Flex } from '@chakra-ui/react';
import { useAppSelector } from '../../../redux/hooks';
import AdvertCard from './AdvertCard';

export default function MainList(): JSX.Element {
  const adverts = useAppSelector((state) => state.advert.adverts);

  return (
    <Flex direction="row" wrap="wrap" gap={4}  justifyContent="center">
      {adverts.map((advert) => (
        <AdvertCard key={advert.id} advert={advert} />
      ))}
    </Flex>
  );
}
