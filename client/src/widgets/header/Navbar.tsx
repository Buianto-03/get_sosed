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
  useToast,
  Stack,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { UserStatus } from '@entities/session/model/auth';
import { logoutThunk } from '@features/logout/thunks';

export default function Navbar(): JSX.Element {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const user = useAppSelector((store) => store.auth.user);
  const dispatch = useAppDispatch();
  const toast = useToast();

  const handleCloseMenu = (): void => {
    onClose(); // Закрытие меню
  };

  return (
    <Box bg="#F3F3FF" px={4}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <IconButton
          size="md"
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label="Open Menu"
          display={{ md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
          bg="#cacae2"
          _hover={{
            bg: '#D6D6FF', // чуть темнее, чем #EDEDFF
          }}
        />
        <HStack spacing={8} alignItems="center">
          <Box
            style={{ width: '40px', marginLeft: '20px' }}
            cursor="pointer"
            onClick={() => navigate('/')}
          >
            <img src="/logo.png" alt="logo" />
          </Box>
          <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
            <ChakraLink
              as={Link}
              to="/"
              style={{ fontFamily: 'sans-serif', fontWeight: 'inherit', fontSize: '1.15rem' }}
            >
              Главная
            </ChakraLink>
            <ChakraLink
              style={{ fontFamily: 'sans-serif', fontWeight: 'inherit', fontSize: '1.15rem' }}
              as={Link}
              to="/home"
            >
              Поиск
            </ChakraLink>
            {user.status === UserStatus.Logged ? (
              <ChakraLink
                as={Link}
                to="/post"
                style={{ fontFamily: 'sans-serif', fontWeight: 'inherit', fontSize: '1.15rem' }}
              >
                Добавить объявление
              </ChakraLink>
            ) : null}
          </HStack>
        </HStack>
        <Flex alignItems="center">
          <Menu>
            <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0}>
              <Avatar
                size="md"
                name={user.status === UserStatus.Logged ? user.name : 'Гость'}
                border="2px"
                borderColor=""
                src={
                  user.status === UserStatus.Logged && user.UserProfile && user.UserProfile.photo
                    ? user.UserProfile.photo
                    : undefined
                }
              />
            </MenuButton>
            <MenuList>
              {user.status === UserStatus.Logged ? (
                <>
                  <MenuItem
                    onClick={() => {
                      navigate('/account');
                      onClose();
                    }}
                  >
                    {user.status === UserStatus.Logged ? `Аккаунт ${user.name}` : 'Гость'}
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    onClick={() => {
                      void dispatch(logoutThunk()).unwrap().catch(() => {
                        toast({ title: 'Не удалось выйти. Повторите попытку.', status: 'error' });
                      });
                      onClose();
                    }}
                  >
                    Выйти
                  </MenuItem>
                </>
              ) : (
                <>
                  <MenuItem
                    onClick={() => {
                      navigate('/signin');
                      onClose();
                    }}
                  >
                    Войти
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      navigate('/signup');
                      onClose();
                    }}
                  >
                    Зарегистрироваться
                  </MenuItem>
                </>
              )}
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as="nav" spacing={4} onClick={handleCloseMenu}>
            <ChakraLink as={Link} to="/" onClick={handleCloseMenu}>
              Главная
            </ChakraLink>
            <ChakraLink as={Link} to="/home" onClick={handleCloseMenu}>
              Поиск
            </ChakraLink>
            {user.status === UserStatus.Logged && <ChakraLink as={Link} to="/post" onClick={handleCloseMenu}>
              Добавить объявление
            </ChakraLink>}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}
