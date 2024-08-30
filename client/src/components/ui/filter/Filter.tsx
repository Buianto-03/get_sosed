import React, { useCallback, useEffect, useState } from 'react';
import {
  InputGroup,
  Input,
  Button,
  Box,
  Flex,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  Text,
  FormControl,
  FormLabel,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  HStack,
  NumberInput,
  NumberInputField,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import { debounce } from 'lodash';
import { addTag, removeTag, setFilters, setTags } from '../../../redux/slices/adverts/advertsSlice'; // Измените на правильное действие
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { getTagsBySearchThunk } from '../../../redux/slices/adverts/advertsThunk';
import type { TagType } from '../../../types/advert';

export default function Filter(): JSX.Element {
  const initFilters = useAppSelector((store) => store.advert.filters);
  const [inputValue, setInputValue] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    initFilters.priceFrom,
    initFilters.priceTo,
  ]);
  const [roomsRange, setRoomsRange] = useState<[number, number]>([
    initFilters.roomsFrom,
    initFilters.roomsTo,
  ]); // Количество комнат
  const [city, setCity] = useState<string>(initFilters.city);
  const [district, setDistrict] = useState<string>(initFilters.district);
  const [metro, setMetro] = useState<string>(initFilters.metro);
  // const [category, setCategory] = useState<string>(initFilters.category); // Категория (Квартиры, Дома, Вторичка, Новостройка)
  //  // Состояние для хранения предложенных тегов на основе ввода

  const dispatch = useAppDispatch();
  const tags = useAppSelector((store) => store.advert.tags);
  const pickedTags = useAppSelector((store) => store.advert.pickedTags);
  const {isOpen, onOpen, onClose} = useDisclosure();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string): void => {
      if (query.trim() === '') {
        dispatch(setTags([])); // сделать првоерку на filter дописать
        return;
      }
      dispatch(getTagsBySearchThunk(query)).catch(console.log);
    }, 300),
    [],
  );

  useEffect(() => {
    if (inputValue === '') return;
    debouncedSearch(inputValue);
  }, [inputValue, debouncedSearch]);

  const popoverWidth = useBreakpointValue({ base: '100vw', md: '80vw' });

  const handleFilter = (): void => {
    // Собираем параметры фильтрации и отправляем в Redux asdad
    const filters = {
      query: inputValue,
      priceFrom: priceRange[0],
      priceTo: priceRange[1],
      city,
      district,
      metro,
      // category,
      tags: pickedTags,
      roomsFrom: roomsRange[0],
      roomsTo: roomsRange[1],
    };
    dispatch(setFilters(filters));
    onClose() // Отправляем параметры фильтрации в Redux
  };
  const handleTagClick = (tag: TagType): void => {
    dispatch(addTag(tag));
    setInputValue('');
  };
  const handleRemoveTag = (tag: TagType): void => {
    dispatch(removeTag(tag.id)); // Передаем только идентификатор тега
  };
  return (
    <Flex
      p={4}
      bg="#F3F3FF"
      borderRadius="md"
      boxShadow="md"
      width="100%"
      // alignItems="center"
      justifyContent="center"
    >
      {/* Поповер для фильтра и категорий */}
      <Popover isOpen={isOpen} onClose={onClose} onOpen={onOpen}>
        <PopoverTrigger>
          <Button
            size="lg"
            borderRadius="md"
            bg="blue.50"
            color="blue.700"
            borderColor="blue.300"
            _hover={{ bg: 'blue.100' }}
            mr={4}
            onClick={onOpen}
          >
            Фильтр
          </Button>
        </PopoverTrigger>
        <PopoverContent width={popoverWidth} maxWidth="100vw" marginX="auto" position="relative">
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverBody>
            <Tabs variant="enclosed">
              <TabList>
                <Tab>Фильтр</Tab>
                {/* <Tab>Категории</Tab> */}
              </TabList>
              <TabPanels>
                {/* <TabPanel>
                  <Box>
                    <Flex align="center" mt={2} onClick={() => setCategory('Квартиры')}>
                      <Text flex="1">Квартиры</Text>
                      <Icon as={ChevronRightIcon} />
                    </Flex>
                    <Flex align="center" mt={2} onClick={() => setCategory('Дома')}>
                      <Text flex="1">Дома</Text>
                      <Icon as={ChevronRightIcon} />
                    </Flex>
                  </Box>
                </TabPanel> */}
                <TabPanel>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Цена (₽)</FormLabel>
                      <RangeSlider
                        // aria-label={['min', 'max']}
                        value={priceRange}
                        min={0}
                        max={300000}
                        step={1000}
                        onChange={(val) => setPriceRange(val as [number, number])}
                      >
                        <RangeSliderTrack>
                          <RangeSliderFilledTrack />
                        </RangeSliderTrack>
                        <RangeSliderThumb index={0} />
                        <RangeSliderThumb index={1} />
                      </RangeSlider>
                      <HStack justifyContent="space-between" mt={2}>
                        <NumberInput
                          maxW="100px"
                          mr="2rem"
                          value={priceRange[0]}
                          onChange={(value) => setPriceRange([Number(value), priceRange[1]])}
                          min={0}
                          max={priceRange[1]}
                        >
                          <NumberInputField />
                        </NumberInput>
                        <Text>до</Text>
                        <NumberInput
                          maxW="100px"
                          value={priceRange[1]}
                          onChange={(value) => setPriceRange([priceRange[0], Number(value)])}
                          min={priceRange[0]}
                          max={400000}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </HStack>
                    </FormControl>

                    {/* <FormControl>
                      <FormLabel>Количество комнат</FormLabel>
                      <NumberInput
                        min={1}
                        max={5}
                        value={rooms}
                        onChange={(value) => setRooms(Number(value))}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl> */}

                    <FormControl>
                      <FormLabel>Кол-во комнат</FormLabel>
                      <RangeSlider
                        // aria-label={['min', 'max']}
                        value={roomsRange}
                        min={0}
                        max={8}
                        step={1}
                        onChange={(val) => setRoomsRange(val as [number, number])}
                      >
                        <RangeSliderTrack>
                          <RangeSliderFilledTrack />
                        </RangeSliderTrack>
                        <RangeSliderThumb index={0} />
                        <RangeSliderThumb index={1} />
                      </RangeSlider>
                      <HStack justifyContent="space-between" mt={2}>
                        <NumberInput
                          maxW="100px"
                          mr="2rem"
                          value={roomsRange[0]}
                          onChange={(value) => setRoomsRange([Number(value), roomsRange[1]])}
                          min={0}
                          max={roomsRange[1]}
                        >
                          <NumberInputField />
                        </NumberInput>
                        <Text>до</Text>
                        <NumberInput
                          maxW="100px"
                          value={roomsRange[1]}
                          onChange={(value) => setRoomsRange([roomsRange[0], Number(value)])}
                          min={priceRange[0]}
                          max={8}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </HStack>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Город</FormLabel>
                      <Input
                        placeholder="Город"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Район</FormLabel>
                      <Input
                        placeholder="Район"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Метро</FormLabel>
                      <Input
                        placeholder="Метро"
                        value={metro}
                        onChange={(e) => setMetro(e.target.value)}
                      />
                    </FormControl>

                    <Button onClick={handleFilter} colorScheme="blue" width="full">
                      Применить фильтр
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </PopoverBody>
        </PopoverContent>
      </Popover>

      {/* Поле поиска */}
      <Box width="100%" maxW={popoverWidth}>
        <InputGroup>
          <Input
            placeholder="Поиск по объявлениям"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            size="lg"
            borderRadius="md"
          />
          {/* <InputRightElement>
            <Button onClick={handleFilter} colorScheme="blue" borderRadius="md" mt={2}>
              <SearchIcon />
            </Button>
          </InputRightElement> */}
        </InputGroup>
        {/**
         */}
        <Box mt={4}>
          {pickedTags.map((tag) => (
            <Button
              key={tag.id}
              variant="outline"
              colorScheme="blue"
              mr={2}
              mb={2}
              onClick={() => handleRemoveTag(tag)}
            >
              {tag.name}
            </Button>
          ))}
        </Box>
        {/* Список предложенных тегов */}
        {inputValue && (
          <Box
            mt={2}
            borderRadius="md"
            boxShadow="md"
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            zIndex={1}
            position="absolute"
            width="100%"
            maxW={popoverWidth}
          >
            {tags && tags.length ? (
              tags.map((tag) => (
                <Flex
                  key={tag.id}
                  p={2}
                  align="center"
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                  onClick={() => handleTagClick(tag)}
                >
                  <Text>{tag.name}</Text>
                </Flex>
              ))
            ) : (
              <Text p={2}>Нет подходящих тегов</Text>
            )}
          </Box>
        )}
      </Box>
    </Flex>
  );
}
