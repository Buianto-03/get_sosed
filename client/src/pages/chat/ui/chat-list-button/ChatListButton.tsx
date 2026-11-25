import React from 'react';
import { LuArrowLeft } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { routes } from '@shared/config/routes';
import { Button, ButtonVariant } from '@shared/ui/button/Button';

interface ChatListButtonProps {
  className?: string;
  withIcon?: boolean;
}

export function ChatListButton({ className, withIcon }: ChatListButtonProps): JSX.Element {
  const navigate = useNavigate();

  return (
    <Button className={className} variant={ButtonVariant.Text} onClick={() => navigate(routes.messages)}>
      {withIcon && <LuArrowLeft aria-hidden="true" />}К диалогам
    </Button>
  );
}
