import React from 'react';
import { Spinner } from 'reactstrap';

type LoaderProps = {
  children: JSX.Element;
  loading: boolean;
};

export default function Loader({ children, loading }: LoaderProps): JSX.Element {
  if (loading)
    return (
      <Spinner
        color="primary"
        style={{
          height: '10rem',
          width: '10rem',
        }}
        type="grow"
      >
        Loading...
      </Spinner>
    );
  return children;
}
