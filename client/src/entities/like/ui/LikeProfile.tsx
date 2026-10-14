import React, { useState } from 'react';
import {
  Box,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  Button,
  Tag,
  Popover,
  PopoverTrigger,
  Avatar,
  TagLabel,
  Text,
} from '@chakra-ui/react';
import type { LikeType } from '../model/like';

type LikeProfileProp = {
  like: LikeType;
  onMessage: (userId: number) => void;
};

export default function LikeProfile({ like, onMessage }: LikeProfileProp): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover placement="top" isOpen={isOpen}>
      <Tag key={like.id} mt={1} size="lg" colorScheme="red" borderRadius="full">
        <PopoverTrigger>
          <Avatar
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            // src={like.User.photo}
            size="xs"
            name={like.User?.name}
            ml={-1}
            mr={2}
          />
        </PopoverTrigger>
        <TagLabel>{like.User?.name}</TagLabel>
      </Tag>
      <PopoverContent
        width="auto"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <PopoverHeader>
          <Avatar
            // src={like.User.photo}
            size="md"
            name={like.User?.name}
            // ml={-1}
            mr={2}
          />
          {like.User?.name}
        </PopoverHeader>
        <PopoverBody>
          <Box>
            <Text>{like.User?.UserProfile.age} лет</Text>
            <Text>{like.User?.UserProfile.about}</Text>
          </Box>
        </PopoverBody>
        <Button onClick={() => { if (like.User) onMessage(like.User.id); }}>Написать соседу</Button>
      </PopoverContent>
    </Popover>
  );
}
