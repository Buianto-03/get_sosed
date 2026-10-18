import {
  Container,
  Grid,
  GridItem,
  Box,
  Text,
  Heading,
  Divider,
  VStack,
  Button,
  Icon,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import {
  deleteLikeThunk,
  getLikesThunk,
  setLikeThunk,
} from '@entities/like/model/likesThunk';
import LikeProfile from '@entities/like/ui/LikeProfile';
import PhotosCarousel from '@shared/ui/PhotosCarousel';
import { UserStatus } from '@entities/session/model/auth';
import YMap from '@shared/ui/YMap';
import { getAdvertByIdThunk } from '@entities/advert/model/advertsThunk';
import { routes } from '@shared/config/routes';

export default function AdvertPage(): JSX.Element {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const advert = useAppSelector((store) => store.advert.chosenAdvert);
  const likes = useAppSelector((store) => store.likes.likes);
  const user = useAppSelector((store) => store.auth.user);
  const { listingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    if (!listingId || !Number.isInteger(Number(listingId)) || Number(listingId) <= 0) {
      setRequestError('Объявление не найдено.');
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setRequestError('');
    void dispatch(getAdvertByIdThunk(Number(listingId))).unwrap()
      .then((loadedAdvert) => dispatch(getLikesThunk(loadedAdvert.id)).unwrap())
      .catch(() => { if (active) setRequestError('Не удалось загрузить объявление.'); })
      .finally(() => { if (active) setLoading(false); });
    window.scrollTo(0, 0);
    return () => { active = false; };
  }, [dispatch, listingId]);

  const isLiked = (): boolean =>
    user.status === UserStatus.Logged && advert
      ? likes.some((like) => like.userId === user.id && like.advertId === advert.id)
      : false;

  const likeHandler = (): void => {
    if (user.status === UserStatus.Logged && advert) {
      const action = isLiked() ? deleteLikeThunk(advert.id) : setLikeThunk(advert.id);
      void dispatch(action).unwrap().catch(() => setRequestError('Не удалось обновить лайк.'));
    }
  };

  if (loading) return <Container p={6}>Загрузка объявления...</Container>;
  if (requestError && !advert) return <Container p={6} role="alert">{requestError}</Container>;

  return advert ? (
    <>
      {requestError && <Container p={2} color="red.500" role="alert">{requestError}</Container>}
      <Container p={6} maxW="container.xl" display="flex" justifyContent="center">
        <Grid h="auto" w="100%" templateColumns="repeat(5, 1fr)" gap={6}>
          <GridItem colSpan={3}>
            <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={6} bg="white">
              {/* <Image src="/images/1.jpg" /> */}
              <PhotosCarousel photos={advert.AdvertPhotos?.flatMap((photo) => photo.photo ? [photo.photo] : []) ?? []} />
              <Heading as="h2" size="lg" mb={4} pt={5}>
                О квартире
              </Heading>
              <Text mt={2}>Комнаты: {advert.rooms ?? 'Не указано'}</Text>
              <Text mt={2}>Площадь: {advert.square ?? 'Не указано'}</Text>
              <Text mt={2}>Этаж: {advert.floor ?? 'Не указано'}</Text>
              <Heading as="h2" size="lg" mb={4} pt={5}>
                Расположение
              </Heading>
              <VStack align="start" spacing={2}>
                <Text>Город: {advert.location?.city ?? 'Не указано'}</Text>
                <Text>Район: {advert.location?.district ?? 'Не указано'}</Text>
                <Text>Адрес: {advert.location?.address ?? 'Не указано'}</Text>
                <Text>Метро: {advert.location?.metro ?? 'Не указано'}</Text>
              </VStack>
            </Box>
          </GridItem>
          <GridItem colSpan={2}>
            <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={6} bg="white">
              <Heading as="h1" size="xl" mt={4}>
                {advert.title ?? 'Объявление'}
              </Heading>
              <Text mt={2}>{advert.body}</Text>
              <Heading mt={2} fontWeight="bold">
                {advert.price === null ? 'Цена не указана' : `Цена: ${advert.price} руб.`}
              </Heading>
              <br />
              <Heading as="h2" size="lg" mb={4}>
                Информация о владельце
              </Heading>
              <VStack align="start" spacing={2}>
                <Text>Имя: {advert.user?.name ?? 'Не указано'}</Text>
                <Text>Email: {advert.user?.email ?? 'Не указан'}</Text>
              </VStack>
              <Button
                isDisabled={!advert.userId}
                colorScheme="teal"
                size="lg"
                onClick={() =>
                  user.status === UserStatus.Logged && user.id === advert.userId
                    ? navigate(routes.listingDetails(advert.id))
                    : advert.userId && navigate(routes.messageThread(advert.userId))
                }
                mr={5}
              >
                Написать соседу
              </Button>
              <Button variant="ghost" colorScheme="blue" mr={2} onClick={likeHandler}>
                {!isLiked() ? (
                  <Icon as={FaThumbsUp} boxSize={6} />
                ) : (
                  <Icon as={FaThumbsDown} boxSize={6} />
                )}
              </Button>

              <Divider my={4} />
              <Heading as="h3" mb={3} size="md">
                Нравится:
              </Heading>
              {likes.map((like) => (
                <LikeProfile key={like.id} like={like} onMessage={(userId) => navigate(routes.messageThread(userId))} />
              ))}
            </Box>
          </GridItem>
        </Grid>
      </Container>
      <Container p={6} maxW="container.xl" display="flex" justifyContent="center">
        {advert.location?.coordinates && <YMap location={advert.location.coordinates} />}
      </Container>
    </>
  ) : (
    <Container p={6} maxW="container.xl" display="flex" justifyContent="center">
      <Text>Объявление не найдено</Text>
    </Container>
  );
}
