import { Box } from '@chakra-ui/react';
import React from 'react';
import AdvertList from '../../ui/main/AdvertList';
import Filtr from '../../ui/filtr/Filtr';
import PopularCard from '../../ui/main/PopularCard';

export default function MainPage(): JSX.Element {
  return (
    <Box>
      <Filtr />
      <PopularCard/>
      <AdvertList />
    </Box>
  );
}

