import React, { useEffect, useState } from 'react';
import {
  Box, Button, Flex, FormControl, FormLabel, Input, Popover, PopoverBody,
  PopoverCloseButton, PopoverContent, PopoverTrigger, SimpleGrid, Text,
} from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import advertService from '@entities/advert/api/advertService';
import { useTagCatalog } from '@entities/advert/model/use-tag-catalog';
import { TagCatalogState } from '@entities/advert/model/tag-catalog';
import type { TagType } from '@entities/advert/model/advertsModel';
import { readFilters, writeFilters } from './model/filters';
import type { AppliedFilters } from './model/filters';

type TextField = 'city' | 'district' | 'metro';
type NumberField = 'priceFrom' | 'priceTo' | 'roomsFrom' | 'roomsTo';

export default function Filter(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.toString();
  const [draft, setDraft] = useState<AppliedFilters>(() => readFilters(searchParams));
  const [tagQuery, setTagQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TagType[]>([]);
  const catalog = useTagCatalog();
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const knownTags = [...catalog.tags, ...selectedTags];
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(readFilters(new URLSearchParams(query)));
  }, [query]);

  useEffect(() => {
    if (!tagQuery.trim()) {
      setSuggestions([]);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      void advertService.getTagsBySearch(tagQuery).then((tags) => {
        if (active) setSuggestions(tags);
      }).catch(() => {
        if (active) setError('Не удалось найти теги.');
      });
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [tagQuery]);

  const setText = (field: TextField, value: string): void => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  };
  const setNumber = (field: NumberField, value: string): void => {
    setDraft((previous) => ({ ...previous, [field]: Number(value) || 0 }));
  };
  const addTag = (tag: TagType): void => {
    setSelectedTags((previous) => [...previous.filter((item) => item.id !== tag.id), tag]);
    setDraft((previous) => ({
      ...previous,
      tagIds: [...new Set([...previous.tagIds, tag.id])],
    }));
    setTagQuery('');
  };
  const apply = (): void => {
    setSearchParams(writeFilters(searchParams, draft));
  };

  return (
    <Box bg="#F3F3FF" p={4}>
      <Popover>
        <PopoverTrigger><Button colorScheme="blue">Фильтр</Button></PopoverTrigger>
        <PopoverContent width={{ base: '95vw', md: '600px' }} maxW="95vw">
          <PopoverCloseButton />
          <PopoverBody p={5}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {(['priceFrom', 'priceTo', 'roomsFrom', 'roomsTo'] as const).map((field) => (
                <FormControl key={field}>
                  <FormLabel>{({ priceFrom: 'Цена от', priceTo: 'Цена до', roomsFrom: 'Комнат от', roomsTo: 'Комнат до' })[field]}</FormLabel>
                  <Input type="number" min={0} value={draft[field] || ''} onChange={(event) => setNumber(field, event.target.value)} />
                </FormControl>
              ))}
              {(['city', 'district', 'metro'] as const).map((field) => (
                <FormControl key={field}>
                  <FormLabel>{({ city: 'Город', district: 'Район', metro: 'Метро' })[field]}</FormLabel>
                  <Input value={draft[field]} onChange={(event) => setText(field, event.target.value)} />
                </FormControl>
              ))}
            </SimpleGrid>
            <Button mt={4} colorScheme="blue" onClick={apply}>Применить фильтр</Button>
          </PopoverBody>
        </PopoverContent>
      </Popover>
      <Box mt={3} maxW="500px">
        <Input
          disabled={catalog.state !== TagCatalogState.Ready}
          aria-label="Поиск тегов"
          placeholder="Поиск тегов"
          value={tagQuery}
          onChange={(event) => setTagQuery(event.target.value)}
        />
        {tagQuery && suggestions.length > 0 && (
          <Box bg="white" borderWidth="1px" borderRadius="md">
            {suggestions.map((tag) => (
              <Button key={tag.id} display="block" variant="ghost" onClick={() => addTag(tag)}>
                {tag.name}
              </Button>
            ))}
          </Box>
        )}
        <Flex gap={2} wrap="wrap" mt={2}>
          {draft.tagIds.map((id) => (
            <Button key={id} size="sm" onClick={() => setDraft((previous) => ({ ...previous, tagIds: previous.tagIds.filter((tagId) => tagId !== id) }))}>
              {knownTags.find((tag) => tag.id === id)?.name ?? `#${id}`} ×
            </Button>
          ))}
        </Flex>
        {draft.tagIds.length > 0 && <Button mt={2} size="sm" colorScheme="blue" onClick={apply}>Применить теги</Button>}
        {catalog.state === TagCatalogState.Loading && <Text role="status">Загрузка условий проживания…</Text>}
        {catalog.state === TagCatalogState.Error && (
          <Box>
            <Text role="alert">{catalog.error}</Text>
            <Button onClick={catalog.reload}>Повторить загрузку условий</Button>
          </Box>
        )}
        {error && <Text color="red.500" role="alert">{error}</Text>}
      </Box>
    </Box>
  );
}
