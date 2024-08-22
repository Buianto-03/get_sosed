import React from 'react';
import { Grid, GridItem, Container, Image } from '@chakra-ui/react';

export default function AccountPage(): JSX.Element {
  return (
    <Container p={4} maxW="container.xl" display="flex" justifyContent="center" height="100svh">
      <Grid
        h="650px"
        w="1225px"
        templateRows="repeat(2, 1fr)"
        templateColumns="repeat(5, 1fr)"
        gap={4}
      >
        <GridItem rowSpan={2} colSpan={1} bg="tomato">
          <Image
            borderRadius="full"
            p="1"
            alignItems="center"
            boxSize="225px"
            src="https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png"
            alt="Dan Abramov"
          />
        </GridItem>
        <GridItem colSpan={2} bg="papayawhip" />
        <GridItem rowSpan={2} colSpan={2} bg="papayawhip" />
        <GridItem colSpan={2} bg="tomato" />
      </Grid>
    </Container>
  );
}
