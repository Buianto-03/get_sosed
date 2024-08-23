import { Box } from '@chakra-ui/react';
import React from 'react';
import AdvertList from '../../ui/main/AdvertList';
import Filter from '../../ui/filter/Filter';
import PopularCard from '../../ui/main/PopularCard';

export default function MainPage(): JSX.Element {
  return (
    <Box>
      <Filter />
      <PopularCard/>
      <AdvertList />
    </Box>
  );
}

