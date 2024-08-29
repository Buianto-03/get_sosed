import React from 'react';
import {
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Stack,
  Heading,
  Text,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../redux/hooks';
import type { LoginForm } from '../../../types/auth';
import { signinThunk } from '../../../redux/slices/auth/thunks';

export default function SignInPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.currentTarget)) as LoginForm;
    // console.log(formData);
    void dispatch(signinThunk(formData));
    
    e.currentTarget.reset();
    console.log('Форма отправлена');
    navigate('/account')

  };

  return (
    <Center minH="100vh" bg="#FAFAFA">
      <Box p={8} maxW="400px" borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <Heading as="h2" size="lg" textAlign="center">
              Вход в личный кабинет
            </Heading>
            <FormControl id="email">
              <FormLabel>Email</FormLabel>
              <Input name='email' type="email" placeholder="Введите ваш email" />
              <FormHelperText>Мы никогда не делимся вашей почтой.</FormHelperText>
            </FormControl>
            <FormControl id="password">
              <FormLabel>Пароль</FormLabel>
              <Input name='password' type="password" placeholder="Введите ваш пароль" />
            </FormControl>
            <Button
              type="submit"
              bg="#00CEC9"
              color="white"
              size="lg"
              mt={4}
              _hover={{ bg: '#00B5B3' }}
            >
              Войти
            </Button>
            <Text textAlign="center">
              Нет аккаунта?{' '}
              <Button onClick={() => navigate('/signup')} variant="link" color="#00CEC9">
                Зарегистрироваться
              </Button>
            </Text>
          </Stack>
        </form>
      </Box>
    </Center>
  );
}
