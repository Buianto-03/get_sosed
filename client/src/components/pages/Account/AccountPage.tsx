import React from 'react';
import { Grid, GridItem, Container, Image } from '@chakra-ui/react';

export default function AccountPage(): JSX.Element {
  return (
    <Container p={4} maxW="container.xl" display="flex" justifyContent="center" height="100vh">
      <Grid
        templateRows={{ base: 'repeat(3, 1fr)', md: 'repeat(2, 1fr)' }}
        templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(5, 1fr)' }}
        gap={4}
        w={{ base: '100%', md: '1225px' }}
        h={{ base: 'auto', md: '650px' }}
      >
        <GridItem rowSpan={{ base: 1, md: 2 }} colSpan={{ base: 1, md: 1 }} bg="tomato">
          <Image
            borderRadius="full"
            p="1"
            alignItems="center"
            boxSize={{ base: '150px', md: '225px' }}
            src="https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png"
            alt="Dan Abramov"
          />
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 2 }} bg="papayawhip" />
        <GridItem rowSpan={{ base: 1, md: 2 }} colSpan={{ base: 1, md: 2 }} bg="papayawhip" />
        <GridItem colSpan={{ base: 1, md: 2 }} bg="tomato" />
      </Grid>
    </Container>
  );
}
