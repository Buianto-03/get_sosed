import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
} from '@chakra-ui/react';

interface DeleteModalConfirmProps {
  onDelete: (id: number) => Promise<unknown>;
  pending: boolean;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  advertId: number | null;
};

export default function DeleteModalConfirm({
  isOpen,
  onClose,
  onDeleted,
  advertId,
  onDelete,
  pending,
}: DeleteModalConfirmProps): JSX.Element {
  const [error, setError] = useState('');

  const handleDeleteLike = (): void => {
    if (advertId !== null) {
      setError('');
      void onDelete(advertId).then(onDeleted)
        .catch(() => setError('Не удалось удалить объявление из избранного.'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader />
        <ModalCloseButton />
        <ModalBody>
          <p role="alert">{error}</p>
          <h1>Вы уверены, что хотите удалить этот элемент?</h1>
        </ModalBody>

        <ModalFooter>
          <Button
            _hover={{ bg: '#b0b0d6', color: 'white' }}
            _active={{ bg: '#9898c2' }}
            color="black"
            mr={3}
            isDisabled={pending}
            onClick={handleDeleteLike}
          >
            Удалить
          </Button>
          <Button
            _hover={{ bg: '#b0b0d6', color: 'white' }}
            _active={{ bg: '#9898c2' }}
            color="black"
            variant="ghost"
            onClick={onClose}
          >
            Закрыть
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
