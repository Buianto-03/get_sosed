import { Box } from '@chakra-ui/react';
import React from 'react';
import AdvertList from '@widgets/advert-feed/AdvertList';
import Filter from '@features/advert-filter/Filter';
import PopularCard from '@widgets/popular-adverts/PopularCard';

export default function MainPage(): JSX.Element {
  return (
    <Box>
      <Filter />
      <PopularCard/>
      <AdvertList />
    </Box>
  );
}

