import React from 'react';
import { Box, Container, Stack, Text, Divider } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';

export default function Footer(): JSX.Element {
  return (
    <Box bg="gray.800" color="gray.200" py={10}>
      <Container maxW="container.xl">
        <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" align="center">
          {/* Логотип или название */}
          <Text fontSize="lg" fontWeight="bold">
            GETSOSED
          </Text>

          {/* Ссылки */}
          <Stack direction={{ base: 'column', md: 'row' }} spacing={6} align="center">
            <NavLink to="/">
              О нас
            </NavLink>
          </Stack>
        </Stack>

        <Divider my={6} borderColor="gray.600" />

        {/* Подпись */}
        <Text textAlign="center" fontSize="sm">
          &copy; {new Date().getFullYear()} GETSOSED. Все права защищены.
        </Text>
      </Container>
    </Box>
  );
}
