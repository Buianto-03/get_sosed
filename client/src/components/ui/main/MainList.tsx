import React from 'react';
import { useAppSelector } from '../../../redux/hooks';
import MainCard from './MainCard';
import { Box } from '@chakra-ui/react';

export default function MainList(): JSX.Element {
  const adverts = useAppSelector((state) => state.advert.adverts);
  return (
    <Box>
    {adverts.map((advert) => (
      <MainCard key={advert.id} advert={advert} />
    ))}
  </Box>;
  )


}
