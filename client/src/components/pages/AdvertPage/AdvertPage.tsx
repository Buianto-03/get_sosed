import {
  Container,
  Grid,
  GridItem,
  Box,
  Text,
  Heading,
  Image,
  Divider,
  VStack,
  Button,
  IconButton,
  useBreakpointValue,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { BiLeftArrowAlt, BiRightArrowAlt } from 'react-icons/bi';
import { PlusSquareIcon } from '@chakra-ui/icons';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import type { AdvertType } from '../../../types/advert';
import { setChosenAdvert } from '../../../redux/slices/adverts/advertsSlice';
import { getLikesThunk } from '../../../redux/slices/likes/likesThunk';
import LikeProfile from '../../ui/LikeProfile';

const mock: AdvertType = {
  id: 1,
  title: 'Уютная квартира в центре',
  body: 'Современная квартира с одной спальней и балконом.',
  userId: 1,
  price: 50000,
  rooms: 2,
  floor: 4,
  square: 70,
  createdAt: '2024-08-22T08:47:48.162Z',
  updatedAt: '2024-08-22T08:47:48.162Z',
  User: {
    id: 1,
    name: 'Admin',
    email: 'admin@1.com',
    roleId: 1,
  },
  Location: {
    id: 1,
    city: 'Москва',
    district: 'Центральный',
    address: 'Тверская улица, 10',
    metro: 'Театральная',
    coordinates: '55.7585, 37.6219',
    advertId: 1,
  },
};

const settings = {
  dots: true,
  arrows: false,
  fade: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
};

const images = [
  'https://images.cdn-cian.ru/images/2199178038-1.jpg',
  'https://images.cdn-cian.ru/images/2199178106-1.jpg',
  'https://images.cdn-cian.ru/images/2199178140-1.jpg',
];

export default function AdvertPage(): JSX.Element {
  const [slider, setSlider] = useState<Slider | null>(null);
  const top = useBreakpointValue({ base: '90%', md: '50%' });
  const side = useBreakpointValue({ base: '30%', md: '10px' });

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const advert = useAppSelector((store) => store.advert.chosenAdvert);
  const likes = useAppSelector((store) => store.likes.likes);

  useEffect(() => {
    void dispatch(setChosenAdvert(mock));
    if (advert) {
      void dispatch(getLikesThunk(advert.id));
    }
  }, [advert, dispatch]);

  return advert ? (
    <Container p={6} maxW="container.xl" display="flex" justifyContent="center" height="100svh">
      <Grid h="auto" w="100%" templateColumns="repeat(5, 1fr)" gap={6}>
        <GridItem colSpan={3}>
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={6} bg="white">
            <Box position="relative" height="600px" width="full" overflow="hidden">
              {/* CSS files for react-slick */}
              <link
                rel="stylesheet"
                type="text/css"
                href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick.min.css"
              />
              <link
                rel="stylesheet"
                type="text/css"
                href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick-theme.min.css"
              />
              {/* Left Icon */}
              <IconButton
                aria-label="left-arrow"
                colorScheme="messenger"
                borderRadius="full"
                position="absolute"
                left={side}
                top={top}
                transform="translate(0%, -50%)"
                zIndex={2}
                onClick={() => slider?.slickPrev()}
              >
                <BiLeftArrowAlt />
              </IconButton>
              {/* Right Icon */}
              <IconButton
                aria-label="right-arrow"
                colorScheme="messenger"
                borderRadius="full"
                position="absolute"
                right={side}
                top={top}
                transform="translate(0%, -50%)"
                zIndex={2}
                onClick={() => slider?.slickNext()}
              >
                <BiRightArrowAlt />
              </IconButton>
              {/* Slider */}
              <Slider
                dots={settings.dots}
                arrows={settings.arrows}
                fade={settings.fade}
                infinite={settings.infinite}
                autoplay={settings.autoplay}
                speed={settings.speed}
                autoplaySpeed={settings.autoplaySpeed}
                slidesToShow={settings.slidesToShow}
                slidesToScroll={settings.slidesToScroll}
                ref={(slider) => setSlider(slider)}
              >
                {images.map((url, index) => (
                  <Box
                    key={index}
                    height="600px"
                    position="relative"
                    backgroundPosition="center"
                    backgroundRepeat="no-repeat"
                    backgroundSize="cover"
                    backgroundImage={`url(${url})`}
                  />
                ))}
              </Slider>
            </Box>

            {/* <Image src="/images/1pic.jpg" alt="/assets/images/1pic.jpg" /> */}
            <Heading as="h2" size="lg" mb={4} pt={5}>
              О квартире
            </Heading>
            <Text mt={2}>Комнаты: {advert.rooms}</Text>
            <Text mt={2}>Площадь: {advert.square}</Text>
            <Text mt={2}>Этаж: {advert.floor}</Text>
            <Heading as="h2" size="lg" mb={4} pt={5}>
              Расположение
            </Heading>
            <VStack align="start" spacing={2}>
              <Text>Город: {advert.Location.city}</Text>
              <Text>Район: {advert.Location.district}</Text>
              <Text>Адрес: {advert.Location.address}</Text>
              <Text>Метро: {advert.Location.metro}</Text>
            </VStack>
          </Box>
        </GridItem>
        <GridItem colSpan={2}>
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={6} bg="white">
            <Heading as="h1" size="xl" mt={4}>
              {advert.title}
            </Heading>
            <Text mt={2}>{advert.body}</Text>
            <Heading mt={2} fontWeight="bold">
              Цена: {advert.price} руб.
            </Heading>
            <br />
            <Heading as="h2" size="lg" mb={4}>
              Информация о владельце
            </Heading>
            <VStack align="start" spacing={2}>
              <Text>Имя: {advert.User.name}</Text>
              <Text>Email: {advert.User.email}</Text>
            </VStack>
            <Button
              colorScheme="teal"
              // bgColor="00CEC9"
              size="lg"
              onClick={() => navigate('/')}
              mr={5}
            >
              Написать соседу
            </Button>
            <Button colorScheme="teal" size="lg">
              <PlusSquareIcon />
            </Button>
            <Divider my={4} />
            <Heading as="h3" mb={3} size="md">
              Нравится:
            </Heading>
            {likes.map((like) => (
              <LikeProfile key={like.id} like={like} />
            ))}
          </Box>
        </GridItem>
      </Grid>
    </Container>
  ) : (
    <Container p={6} maxW="container.xl" display="flex" justifyContent="center" height="100svh">
      <Text>Объявление не найдено</Text>
    </Container>
  );
}
