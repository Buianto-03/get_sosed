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
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { deleteLikeThunk } from '../../../redux/slices/likes/likesThunk';
import { getLikedAdvertsThunk } from '../../../redux/slices/adverts/advertsThunk';

type DeleteModalConfirmProps = {
  onOpen: () => void;
  isOpen: boolean;
  onClose: () => void;
};

export default function DeleteModalConfirm({
  isOpen,
  onClose,
}: DeleteModalConfirmProps): JSX.Element {
  const dispatch = useAppDispatch();
  const like = useAppSelector((store) => store.likes.selectedLike);

  const handleDeleteLike = async (): void => {
    if (like) {
      await dispatch(deleteLikeThunk(like.advertId));
      // Повторный запрос для получения обновленного списка
      await dispatch(getLikedAdvertsThunk());
      onClose();
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Modal Title</ModalHeader>
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
