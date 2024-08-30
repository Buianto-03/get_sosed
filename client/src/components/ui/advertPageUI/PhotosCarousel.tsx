import React, { useState } from 'react';
import { Box, IconButton, Image, useBreakpointValue } from '@chakra-ui/react';
import Slider from 'react-slick';
import { BiLeftArrowAlt, BiRightArrowAlt } from 'react-icons/bi';
import type { AdvertType } from '../../../types/advert';

const settings = {
  dots: true,
  arrows: false,
  fade: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
};

type SliderProp = {
  photos: AdvertType['AdvertPhotos'];
};

export default function PhotosCarousel({ photos }: SliderProp): JSX.Element {
  const [slider, setSlider] = useState<Slider | null>(null);
  const top = useBreakpointValue({ base: '90%', md: '50%' });
  const side = useBreakpointValue({ base: '30%', md: '10px' });
  const sliderHeight = useBreakpointValue({ base: '300px', md: '500px' });

  return (
    <Box position="relative" height={sliderHeight} width="full" overflow="hidden">
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
        speed={settings.speed}
        slidesToShow={settings.slidesToShow}
        slidesToScroll={settings.slidesToScroll}
        ref={(slide) => setSlider(slide)}
      >
        {photos && photos.length > 0 ? (
          photos.map((photo) => (
            <Box
              key={photo.id}
              height={sliderHeight}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <Image
                src={photo.photo}
                alt="Apartment"
                objectFit="contain"
                width="100%"
                height="100%"
              />
            </Box>
          ))
        ) : (
          <Box
            height={sliderHeight}
            position="relative"
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
            backgroundSize="cover"
            backgroundImage="url(/path/to/default/image.jpg)"
          />
        )}
      </Slider>
    </Box>
  );
}
