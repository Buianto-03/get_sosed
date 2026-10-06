import React from 'react';
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
import { useAppDispatch } from '../../app/store/hooks';
import { deleteLikeThunk } from '../../entities/like/model/likesThunk';

type DeleteModalConfirmProps = {
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
}: DeleteModalConfirmProps): JSX.Element {
  const dispatch = useAppDispatch();

  const handleDeleteLike = (): void => {
    if (advertId !== null) {
      void dispatch(deleteLikeThunk(advertId)).unwrap()
        .then(onDeleted)
        .catch(console.error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader />
        <ModalCloseButton />
        <ModalBody>
          <h1>Вы уверены, что хотите удалить этот элемент?</h1>
        </ModalBody>

        <ModalFooter>
          <Button
            _hover={{ bg: '#b0b0d6', color: 'white' }}
            _active={{ bg: '#9898c2' }}
            color="black"
            mr={3}
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
