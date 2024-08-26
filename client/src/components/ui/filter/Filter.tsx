import React, { useEffect, useState } from 'react';
import {
  InputGroup, Input, InputRightElement, Button, Box, Flex, Popover,
  PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverBody,
  Text, Icon, FormControl, FormLabel, VStack, Tabs, TabList, TabPanels, Tab,
  TabPanel, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb,
  HStack, NumberInput, NumberInputField, useBreakpointValue,
} from '@chakra-ui/react';
import { SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useDispatch } from 'react-redux';
import { setFilters } from '../../../redux/slices/adverts/advertsSlice'; // Измените на правильное действие

export default function Filter(): JSX.Element {
  const [inputValue, setInputValue] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [rooms, setRooms] = useState<number>(1); // Количество комнат
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [metro, setMetro] = useState<string>('');
  const [category, setCategory] = useState<string>(''); // Категория (Квартиры, Дома, Вторичка, Новостройка)
  const dispatch = useDispatch();

  const popoverWidth = useBreakpointValue({ base: '100vw', md: '80vw' });

  // useEffect(() => {

  // }, [priceRange])

  const handleSearch = () => {
    // Собираем параметры фильтрации и отправляем в Redux
    const filters = {
      query: inputValue,
      priceFrom: priceRange[0],
      priceTo: priceRange[1],
      city,
      district,
      metro,
      category,
    };
    dispatch(setFilters(filters)); // Отправляем параметры фильтрации в Redux
  };

  return (
    <Flex p={4} bg="gray.100" borderRadius="md" boxShadow="md" width="100%" alignItems="center" justifyContent="center">
      {/* Поповер для фильтра и категорий */}
      <Popover>
        <PopoverTrigger>
          <Button size="lg" borderRadius="md" bg="blue.50" color="blue.700" borderColor="blue.300" _hover={{ bg: 'blue.100' }} mr={4}>
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
                      <RangeSlider aria-label={['min', 'max']} value={priceRange} min={0} max={400000} step={1000} onChange={(val) => setPriceRange(val)}>
                        <RangeSliderTrack>
                          <RangeSliderFilledTrack />
                        </RangeSliderTrack>
                        <RangeSliderThumb index={0} />
                        <RangeSliderThumb index={1} />
                      </RangeSlider>
                      <HStack justifyContent="space-between" mt={2}>
                        <NumberInput maxW="100px" mr="2rem" value={priceRange[0]} onChange={(value) => setPriceRange([Number(value), priceRange[1]])} min={0} max={priceRange[1]}>
                          <NumberInputField />
                        </NumberInput>
                        <Text>до</Text>
                        <NumberInput maxW="100px" value={priceRange[1]} onChange={(value) => setPriceRange([priceRange[0], Number(value)])} min={priceRange[0]} max={400000}>
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
                      <Input placeholder="Город" value={city} onChange={(e) => setCity(e.target.value)} />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Район</FormLabel>
                      <Input placeholder="Район" value={district} onChange={(e) => setDistrict(e.target.value)} />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Метро</FormLabel>
                      <Input placeholder="Метро" value={metro} onChange={(e) => setMetro(e.target.value)} />
                    </FormControl>

                    <Button onClick={handleSearch} colorScheme="blue" width="full">
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
      <InputGroup>
        <Input placeholder="Поиск по объявлениям" value={inputValue} onChange={(e) => setInputValue(e.target.value)} size="lg" borderRadius="md" />
        <InputRightElement>
          <Button onClick={handleSearch} colorScheme="blue" borderRadius="md">
            <SearchIcon />
          </Button>
        </InputRightElement>
      </InputGroup>
    </Flex>
  );
}
