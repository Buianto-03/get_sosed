import React from 'react';
import { Center, Spinner } from '@chakra-ui/react';

type LoaderProps = {
  children: JSX.Element;
  loading: boolean;
};

export default function Loader({ children, loading }: LoaderProps): JSX.Element {
  if (loading)
    return <Center minH="40vh"><Spinner size="xl" color="teal.500" /></Center>;
  return children;
}
