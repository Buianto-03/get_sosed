import { Box, Button, Container, FormControl, FormLabel, Heading, Input } from '@chakra-ui/react';
import React from 'react';
import axios from 'axios';
import { Form, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { postAdvertThunk } from './thunks';
import type { ApiResponse } from './model/geocode';
import { UserStatus } from '../../entities/session/model/auth';
import { YANDEX_API_KEY } from '../../shared/config/env';

export default function PostAdvertForm(): JSX.Element {
  const user = useAppSelector((store) => store.auth.user);
  const [value, setValue] = React.useState<string>('');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const formObject = {
    title: 'Заголовок',
    body: 'Описание',
    price: 'Цена',
    floor: 'Этаж',
    square: 'Площадь',
    rooms: 'Кол-во комнат',
    city: 'Город',
    district: 'Район',
    address: 'Адрес',
    metro: 'Метро',
  };

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!formData.getAll('files').some((file) => file instanceof File && file.size > 0)) {
      setValue('error');
      return;
    }

    const city = formData.get('city') as string;
    const address = formData.get('address') as string;
    if (!city || !address) return;
    const queryAddress = encodeURIComponent(`${city}, ${address}`);

    try {
      const res = await axios<ApiResponse>(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${queryAddress}&lang=ru_RU&format=json`,
      );
        const coordinates =
          res.data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos
            .split(' ')
            .reverse()
            .join(', ');
        formData.append('coordinates', coordinates);
      await dispatch(postAdvertThunk(formData)).unwrap();
      setValue('success');
      setTimeout(() => navigate('/'), 2000);
    } catch {
      setValue('error');
    }
  };

  return (
    <Container>
      {user.status !== UserStatus.Logged && <div>Пожалуйста, авторизуйтесь</div>}
      {user.status === UserStatus.Logged && !value && (
        <>
          <Heading textAlign="center" mt={5} mb={10}>
            Разместите объявление
          </Heading>
          <Form encType="multipart/form-data" onSubmit={(event) => { void submitHandler(event); }}>
            <FormControl display="flex" alignItems="center" pb="5">
              <FormLabel>{formObject.title}</FormLabel>
              <Input name="title" type="text" required/>
            </FormControl>

            <FormControl display="flex" alignItems="center" pb="5">
              <FormLabel>{formObject.body}</FormLabel>
              <Input maxLength={100} name="body" type="text" required/>
            </FormControl>

            <FormControl display="flex" alignItems="center" pb="5">
              <FormLabel whiteSpace="nowrap" width="">
                {formObject.price}, руб
              </FormLabel>
              <Input name="price" type="number" required/>
            </FormControl>

            <FormControl display="flex" alignItems="center" pb="5">
              <FormLabel>{formObject.floor}</FormLabel>
              <Input name="floor" type="text" required/>
            </FormControl>

            <FormControl display="flex" alignItems="center" pb="5">
              <FormLabel whiteSpace="nowrap">{formObject.square}, кв.м.</FormLabel>
              <Input name="square" type="text" required/>
            </FormControl>

            <FormControl display="flex" alignItems="center" pb="5">
              <FormLabel whiteSpace="nowrap">{formObject.rooms}</FormLabel>
              <Input name="rooms" type="text" required />
            </FormControl>

            <FormControl display="flex" alignItems="center" pb="5">
              <FormLabel>{formObject.city}</FormLabel>
              <Input name="city" type="text" required />
            </FormControl>

            <FormControl display="flex" alignItems="center" pb="5">
              <FormLabel>{formObject.district}</FormLabel>
              <Input name="district" type="text" required />
            </FormControl>

            <FormControl display="flex" alignItems="center" pb="5">
              <FormLabel>{formObject.address}</FormLabel>
              <Input name="address" type="text" required />
            </FormControl>

            <FormControl display="flex" alignItems="center" pb="5">
              <FormLabel>{formObject.metro}</FormLabel>
              <Input name="metro" type="text" required />
            </FormControl>

            <FormControl display="flex" alignItems="center" pb="5">
              <FormLabel>Выберите фото</FormLabel>
              <Input name="files" type="file" multiple required />
            </FormControl>

            <Box display="flex" justifyContent="center">
              <Button type="submit">Разместить</Button>
            </Box>
          </Form>
        </>
      )}
      {user.status === UserStatus.Logged && value === 'success' && (
        <div>Объявление опубликовано</div>
      )}
      {user.status === UserStatus.Logged && value === 'error' && (
        <Box role="alert">
          Что-то пошло не так. Повторите позже.
          <Button ml={3} onClick={() => setValue('')}>Повторить</Button>
        </Box>
      )}
    </Container>
  );
}
