import React, { useState } from 'react';
import {
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  FormErrorMessage,
  Radio,
  RadioGroup,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../redux/hooks';
import { signupThunk } from '../../../redux/slices/auth/thunks';

export default function SignUpPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<{ confirmPassword?: string }>({});
  const [gender, setGender] = useState<string>(''); // Состояние для хранения выбранного пола

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // const formData = Object.fromEntries(new FormData(e.currentTarget)) as SignUpSchemaT;

    // // Валидация пароля
    // const { password } = formData;

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    formData.append('gender', gender.toString())

    if (password.length < 9 || !/\d/.test(password)) {
      setErrors({
        confirmPassword: 'Пароль должен быть не менее 9 символов и содержать хотя бы одну цифру',
      });
      return;
    }
    setErrors({});
    
    void dispatch(signupThunk(formData));

    // Если ошибок нет, отправляем данные
    // setErrors({});
    // void dispatch(signupThunk({ ...formData, gender: gender.toString() }));

    // e.currentTarget.reset();
    // console.log('Форма отправлена');
    // navigate('/home');
  };

  return (
    <Center minH="100vh" bg="#FAFAFA">
      <Box p={8} maxW="400px" borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <Heading as="h2" size="lg" textAlign="center">
              Регистрация нового пользователя
            </Heading>
            <FormControl id="username">
              <FormLabel>Имя пользователя</FormLabel>
              <Input name="name" type="text" placeholder="Введите ваше имя" />
            </FormControl>
            <FormControl id="email">
              <FormLabel>Email</FormLabel>
              <Input name="email" type="email" placeholder="Введите ваш email" />
            </FormControl>
            <FormControl id="password">
              <FormLabel>Пароль</FormLabel>
              <Input name="password" type="password" placeholder="Введите ваш пароль" />
            </FormControl>
            <FormControl id="confirmPassword" isInvalid={!!errors.confirmPassword}>
              <FormLabel>Подтвердите пароль</FormLabel>
              <Input name="confirmPassword" type="password" placeholder="Подтвердите ваш пароль" />
              {errors.confirmPassword && (
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl id="gender">
              <FormLabel>Выберите ваш пол</FormLabel>
              <RadioGroup onChange={setGender} value={gender}>
                <Stack spacing={[1, 5]} direction={['column', 'row']}>
                  <Radio value="male">Мужской</Radio>
                  <Radio value="female">Женский</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl id="photo">
              <FormLabel>Выберите фото</FormLabel>
              <Input name="file" type="file" />
            </FormControl>
            <Button
              type="submit"
              bg="#00CEC9"
              color="white"
              size="lg"
              mt={4}
              _hover={{ bg: '#00B5B3' }}
            >
              Зарегистрироваться
            </Button>
            <Text textAlign="center">
              Уже есть аккаунт?{' '}
              <Button onClick={() => navigate('/signin')} variant="link" color="#00CEC9">
                Войти
              </Button>
            </Text>
          </Stack>
        </form>
      </Box>
    </Center>
  );
}
