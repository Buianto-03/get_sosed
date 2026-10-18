import React, { useState } from 'react';
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@app/store/hooks';
import type { LoginForm } from '@entities/session/model/auth';
import { routes } from '@shared/config/routes';
import { getAuthenticationPath, getPostAuthDestination } from '@shared/lib/navigation/safe-return-to';
import { signinThunk } from './thunks';

export default function SignInForm(): JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.currentTarget)) as LoginForm;
    setError('');
    setSubmitting(true);
    try {
      await dispatch(signinThunk(formData)).unwrap();
      navigate(getPostAuthDestination(returnTo), { replace: true });
    } catch {
      setError('Не удалось войти. Проверьте email и пароль.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Center minH="100vh" bg="#FAFAFA">
      <Box p={8} maxW="400px" borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
        <form onSubmit={(event) => { void handleSubmit(event); }}>
          <Stack spacing={4}>
            <Heading as="h2" size="lg" textAlign="center">
              Вход в личный кабинет
            </Heading>
            <FormControl id="email">
              <FormLabel>Email</FormLabel>
              <Input name="email" type="email" placeholder="Введите ваш email" />
              <FormHelperText>Мы никогда не делимся вашей почтой.</FormHelperText>
            </FormControl>
            <FormControl id="password">
              <FormLabel>Пароль</FormLabel>
              <Input name="password" type="password" placeholder="Введите ваш пароль" />
            </FormControl>
            <Button
              type="submit"
              isLoading={submitting}
              bg="#00CEC9"
              color="white"
              size="lg"
              mt={4}
              _hover={{ bg: '#00B5B3' }}
            >
              Войти
            </Button>
            {error && <Text color="red.500" role="alert">{error}</Text>}
            <Text textAlign="center">
              Нет аккаунта?{' '}
              <Button
                onClick={() => navigate(getAuthenticationPath(routes.signUp, returnTo))}
                variant="link"
                color="#00CEC9"
              >
                Зарегистрироваться
              </Button>
            </Text>
          </Stack>
        </form>
      </Box>
    </Center>
  );
}
