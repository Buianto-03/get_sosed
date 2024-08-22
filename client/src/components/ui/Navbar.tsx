import React from 'react';
import {
  Box,
  Flex,
  Avatar,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  Stack,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../redux/hooks';
import { UserStatus } from '../../types/auth';

type Props = {
  children: React.ReactNode;
};

const Links = ['Главная', 'Поиск', 'О нас'];

export function NavLink(props: Props): JSX.Element {
  const { children } = props;

  return (
    <Box
      as="a"
      px={2}
      py={1}
      rounded="md"
      _hover={{
        textDecoration: 'none',
        bg: '#D6D6FF', // чуть темнее, чем #EDEDFF
      }}
      href="#"
    >
      {children}
    </Box>
  );
}

export default function Navbar(): JSX.Element {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const user = useAppSelector((store) => store.auth.user);
  console.log(user);
  

  return (
    <Box bg="#EDEDFF" px={4}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <IconButton
          size="md"
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label="Open Menu"
          display={{ md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
          bg="#EDEDFF"
          _hover={{
            bg: '#D6D6FF', // чуть темнее, чем #EDEDFF
          }}
        />
        <HStack spacing={8} alignItems="center">
          <Box style={{ width: '40px', marginLeft: '20px' }}>
            <img src="./public/logo.png" alt="logo" />
          </Box>
          <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
            {Links.map((link) => (
              <NavLink key={link}>{link}</NavLink>
            ))}
          </HStack>
        </HStack>
        <Flex alignItems="center">
          <Menu>
            <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0}>
              <Avatar
                size="sm"
                src="https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png"
              />
            </MenuButton>
            <MenuList>
              <MenuItem>
                {user.status === UserStatus.Logged ? `Аккаунт ${user.name}` : 'Гость'}
              </MenuItem>
              <MenuItem onClick={() => navigate('/signin')}>Войти</MenuItem>
              <MenuItem>Зарегистрироваться</MenuItem>
              <MenuDivider />
              <MenuItem>Выйти</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as="nav" spacing={4}>
            {Links.map((link) => (
              <NavLink key={link}>{link}</NavLink>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}
