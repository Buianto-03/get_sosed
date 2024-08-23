import React from 'react';
import { Grid, GridItem, Container, Image, Box, Text, VStack } from '@chakra-ui/react';
import { useAppSelector } from '../../../redux/hooks';

export default function AccountPage(): JSX.Element {
  const user = useAppSelector((store) => store.auth.user);
  console.log(user);

  return (
    <Container p={4} maxW="container.xl" display="flex" justifyContent="center" height="100vh">
      <Grid
        templateRows={{ base: 'repeat(3, 1fr)', md: 'repeat(2, 1fr)' }}
        templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(5, 1fr)' }}
        gap={4}
        w={{ base: '100%', md: '1225px' }}
        h={{ base: 'auto', md: '650px' }}
      >
        <GridItem
          rowSpan={{ base: 1, md: 2 }}
          colSpan={{ base: 1, md: 1 }}
          bg="tomato"
          p={4}
          borderRadius="md"
          boxShadow="lg"
        >
          <VStack spacing={2} alignItems="center" mt={4}>
            <Image
              borderRadius="full"
              mb={4}
              maxW={{ base: '100px', md: '150px' }}
              maxH={{ base: '100px', md: '150px' }}
              w="100%"
              h="auto"
              src="https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png"
              alt="User Avatar"
            />
            <Text fontSize="lg" fontWeight="bold" color="white">
              {user.name}
            </Text>
            <Text fontSize="md" color="whiteAlpha.800">
              {user.email}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.700">
              {user?.UserProfile?.about}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.700">
              Age: {user?.UserProfile?.age}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.700">
              Gender: {user?.UserProfile?.gender}
            </Text>
          </VStack>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 2 }} bg="papayawhip" borderRadius="md" boxShadow="lg" />
        <GridItem
          rowSpan={{ base: 1, md: 2 }}
          colSpan={{ base: 1, md: 2 }}
          bg="papayawhip"
          borderRadius="md"
          boxShadow="lg"
        />
        <GridItem colSpan={{ base: 1, md: 2 }} bg="tomato" borderRadius="md" boxShadow="lg" />
      </Grid>
    </Container>
  );
}
