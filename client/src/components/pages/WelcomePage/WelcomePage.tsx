import React from 'react';
import { Box, Text, Grid, GridItem, Container, Heading } from '@chakra-ui/react';

export default function WelcomePage(): JSX.Element {
  return (
    <>
      <div
        style={{
          height: '25rem',
          backgroundColor: 'yellow',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <img
          src="/mainPhoto.jpg"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          backgroundColor="rgba(0, 0, 0, 0.6)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
        >
          <Text fontSize={{ base: '3xl', md: '4xl', lg: '6xl' }} fontWeight="bold">
            Добро пожаловать!
          </Text>
        </Box>
      </div>
      <Container maxW="container.xl" mt={10} mb={10} px={{ base: 4, md: 8 }}>
        <Grid
          h={{ base: 'auto', md: '600px' }}
          templateRows={{ base: 'repeat(4, 1fr)', md: 'repeat(2, 1fr)' }}
          templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
          gap={8}
        >
          <GridItem
            borderRadius="20px"
            rowSpan={{ base: 1, md: 2 }}
            colSpan={1}
            bg="#CACAE2"
            overflow="hidden"
          >
            <Box p={2} h="100%">
              <img
                src="/welcomePageFirst.jpg"
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
              />
            </Box>
          </GridItem>
          <GridItem
            borderRadius="20px"
            rowSpan={{ base: 1, md: 2 }}
            colSpan={{ base: 1, md: 2 }}
            bg="#F3F3FF"
            overflow="hidden"
          >
            <Box p={4}>
              <Heading as="h2" size={{ base: 'lg', md: 'xl' }}>
                Проблема которую мы решаем
              </Heading>
              <Text fontSize={{ base: 'md', md: 'xl' }}>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Dolorem maxime voluptatum
                voluptatibus iure perferendis laudantium quibusdam. Cumque fugit magnam unde
                delectus ex eos dolorem, quam reiciendis quasi natus a aliquam. Lorem, ipsum dolor
                sit amet consectetur adipisicing elit. Error numquam natus ex ab id earum, maiores,
                quod praesentium recusandae quisquam temporibus corporis quibusdam assumenda esse
                sint quam, labore facilis molestiae?
              </Text>
            </Box>
          </GridItem>
          <GridItem
            borderRadius="20px"
            rowSpan={1}
            colSpan={{ base: 1, md: 2 }}
            bg="#F3F3FF"
            overflow="hidden"
            h={{ base: 'auto', md: '300px' }}
          >
            <Box p={4}>
              <Heading as="h2" size={{ base: 'lg', md: 'xl' }}>
                Что мы предлагаем
              </Heading>
              <Text fontSize={{ base: 'md', md: 'xl' }}>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Dolorem maxime voluptatum
                voluptatibus iure perferendis laudantium quibusdam. Cumque fugit magnam unde
                delectus ex eos dolorem, quam reiciendis quasi natus a aliquam. Lorem ipsum dolor
                sit, amet consectetur adipisicing elit. Praesentium doloremque similique quaerat,
                suscipit natus reiciendis id debitis accusantium quae repudiandae, quia, non
                blanditiis! Quis suscipit beatae, accusamus consequuntur voluptatum delectus?
              </Text>
            </Box>
          </GridItem>
          <GridItem
            borderRadius="20px"
            rowSpan={1}
            colSpan={{ base: 1, md: 1 }}
            bg="#CACAE2"
            overflow="hidden"
            h={{ base: 'auto', md: '300px' }}
          >
            <Box p={2} h="100%">
              <img
                src="/welcomePageSecond.jpg"
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
              />
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </>
  );
}
