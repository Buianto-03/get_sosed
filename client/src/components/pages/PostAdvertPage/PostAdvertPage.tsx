import { Box, Button, Container, FormControl, FormLabel, Heading, Input } from '@chakra-ui/react';
import React from 'react';
import { Form, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { postAdvertThunk } from '../../../redux/slices/adverts/advertsThunk';
import axiosInstance from '../../../services/client';
import type { ApiResponse } from '../../../types/postAdvertInterfaces';
import { UserStatus } from '../../../types/auth';

export default function PostAdvertPage(): JSX.Element {
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

  const submitHandler: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fileInput = e.currentTarget.files as HTMLInputElement;
    const { files } = fileInput;
    if (!files?.length) {
      console.error('No files selected');
      return;
    }

    const city = formData.get('city') as string;
    const address = formData.get('address') as string;
    if (!city || !address) return;
    const queryAddress = `${city}, ${address}`.replaceAll(' ', '+');

    axiosInstance<ApiResponse>(
      `https://geocode-maps.yandex.ru/1.x/?apikey=2955bf46-ac2f-4eeb-86ca-2434442ed867&geocode=${queryAddress}&lang=ru_RU&format=json`,
    )
      .then((res) => {
        const coordinates =
          res.data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos
            .split(' ')
            .reverse()
            .join(', ');
        formData.append('coordinates', coordinates);
        dispatch(postAdvertThunk(formData))
          .then(() => {
            setValue('success');
            setTimeout(() => {
              navigate('/');
            }, 2000);
          })
          .catch(() => setValue('error'));
      })
      .catch(() => setValue('error'));
  };

  return (
    <Container>
      {user.status !== UserStatus.Logged && <div>Пожалуйста, авторизуйтесь</div>}
      {user.status === UserStatus.Logged && !value && (
        <>
          <Heading textAlign="center" mt={5} mb={10}>
            Разместите объявление
          </Heading>
          <Form encType="multipart/form-data" onSubmit={submitHandler}>
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
        <div>Что-то пошло не так. Повторите позже</div>
      )}
    </Container>
  );
}
