import React, { useCallback, useEffect, useState } from 'react';
import {
  InputGroup,
  Input,
  InputRightElement,
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
  Icon,
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
  Select,
} from '@chakra-ui/react';
import { SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { debounce } from 'lodash';
import { addTag, removeTag, setFilters, setTags } from '../../../redux/slices/adverts/advertsSlice'; // Измените на правильное действие
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { getTagsBySearchThunk } from '../../../redux/slices/adverts/advertsThunk';

export default function Filter(): JSX.Element {
  const [inputValue, setInputValue] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [rooms, setRooms] = useState<number>(1); // Количество комнат
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [metro, setMetro] = useState<string>('');
  const [category, setCategory] = useState<string>(''); // Категория (Квартиры, Дома, Вторичка, Новостройка)
  //  // Состояние для хранения предложенных тегов на основе ввода

  const dispatch = useAppDispatch();
  const tags = useAppSelector((store) => store.advert.tags);
  const pickedTags = useAppSelector((store) => store.advert.pickedTags);
  console.log(tags);

  const debouncedSearch = useCallback(
    debounce((query: string): void => {
      if (query.trim() === '') {
        dispatch(setTags([]));
        return;
      }
      dispatch(getTagsBySearchThunk(query)).catch(console.log);
    }, 300),
    [],
  );

  useEffect(() => {
    debouncedSearch(inputValue);
  }, [inputValue, debouncedSearch]);

  // useEffect(() => {
  //   dispatch(loadTagsFromStorage());
  // }, [dispatch]);

  const popoverWidth = useBreakpointValue({ base: '100vw', md: '80vw' });

  const handleFilter = () => {
    // Собираем параметры фильтрации и отправляем в Redux
    const filters = {
      query: inputValue,
      priceFrom: priceRange[0],
      priceTo: priceRange[1],
      city,
      district,
      metro,
      category,
      // tags: pickedTags
    };
    dispatch(setFilters(filters)); // Отправляем параметры фильтрации в Redux
  };
  const handleTagClick = (tag: string) => {
    dispatch(addTag(tag));
    setInputValue('');
  };
  const handleRemoveTag = (tag: { id: string; name: string }) => {
    dispatch(removeTag(tag.id)); // Передаем только идентификатор тега
  };
  return (
    <Flex
      p={4}
      bg="gray.100"
      borderRadius="md"
      boxShadow="md"
      width="100%"
      alignItems="center"
      justifyContent="center"
    >
      {/* Поповер для фильтра и категорий */}
      <Popover>
        <PopoverTrigger>
          <Button
            size="lg"
            borderRadius="md"
            bg="blue.50"
            color="blue.700"
            borderColor="blue.300"
            _hover={{ bg: 'blue.100' }}
            mr={4}
          >
            Категории и фильтр
          </Button>
        </PopoverTrigger>
        <PopoverContent width={popoverWidth} maxWidth="100vw" marginX="auto" position="relative">
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverBody>
            <Tabs variant="enclosed">
              <TabList>
                <Tab>Категории</Tab>
                <Tab>Фильтр</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
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
                </TabPanel>
                <TabPanel>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Цена (₽)</FormLabel>
                      <RangeSlider
                        aria-label={['min', 'max']}
                        value={priceRange}
                        min={0}
                        max={400000}
                        step={1000}
                        onChange={(val) => setPriceRange(val)}
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
                      <NumberInput min={1} max={5} value={rooms} onChange={(value) => setRooms(Number(value))}>
                        <NumberInputField />
                      </NumberInput>
                    </FormControl> */}

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
          <InputRightElement>
            <Button onClick={handleFilter} colorScheme="blue" borderRadius="md">
              <SearchIcon />
            </Button>
          </InputRightElement>
        </InputGroup>
        {/**
         * Выбранные теги {pickedTags.map(tag => <Button >tag.name</Button>)}
         */}
        <Box mt={4}>
          {pickedTags.map((tag) => (
            <Button
              key={tag.id}
              variant="outline"
              colorScheme="blue"
              mr={2}
              mb={2}
              onClick={() => handleRemoveTag(tag)} // Удаление тега при клике
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
            {tags.length > 0 ? (
              tags.map((tag) => (
                <Flex
                  key={tag.id}
                  p={2}
                  align="center"
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                  onClick={() => handleTagClick(tag)} // dispatch(addTag(tag???))
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
