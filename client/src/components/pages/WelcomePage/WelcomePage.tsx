import React from 'react';
import { Box, Heading, Text, Button, Stack, Image, Container } from '@chakra-ui/react';

export default function WelcomePage(): JSX.Element {
  return (
    <Box
      bg="gray.50"
      color="gray.800"
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW="lg" textAlign="center" py={10} px={6} boxShadow="lg" borderRadius="md" bg="white">
        <Image 
          src="https://via.placeholder.com/150" 
          alt="Лого" 
          mx="auto" 
          mb={4} 
          borderRadius="full"
          boxShadow="md"
        />
        <Heading as="h1" size="2xl" mb={4}>
          Добро пожаловать в Студенческий Жилищный Центр!
        </Heading>
        <Text fontSize="lg" mb={6} color="gray.600">
          Найдите идеальное жилье или соседа для совместной аренды. Лучший сервис, разработанный специально для студентов.
        </Text>
        <Stack direction="row" spacing={4} justify="center">
          <Button
            colorScheme="teal"
            variant="solid"
            size="lg"
            boxShadow="md"
            _hover={{ boxShadow: 'xl' }}
          >
            Найти жильё
          </Button>
          <Button
            colorScheme="blue"
            variant="outline"
            size="lg"
            boxShadow="md"
            _hover={{ boxShadow: 'xl' }}
          >
            Разместить объявление
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
