import React from 'react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import { Box } from '@chakra-ui/react';

type YMapProp = {
  location: string;
};

export default function YMap({ location }: YMapProp): JSX.Element {
  const defaultState = {
    center: location.split(', ').map((el) => +el),
    zoom: 15,
  };

  return (
    <YMaps>
      <Box w="100%" h="600px">
        <Map defaultState={defaultState} width="100%" height="100%">
          <Placemark geometry={location.split(', ')} />
        </Map>
      </Box>
    </YMaps>
  );
}
