import React, { useId, useState } from 'react';
import { Button, ButtonSize, ButtonType, ButtonVariant } from '@shared/ui/button/Button';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Input } from '@shared/ui/input/Input';
import styles from './MessageComposer.module.scss';

interface MessageComposerProps {
  conversationId: string;
  loading?: boolean;
  onSendMessage: (conversationId: string, message: string) => boolean;
}

export function MessageComposer({
  conversationId,
  loading,
  onSendMessage,
}: MessageComposerProps): JSX.Element {
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState(false);
  const inputId = useId();

  const sendMessage = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const message = draft.trim();
    if (loading || !message) {
      return;
    }
    const sent = onSendMessage(conversationId, message);
    setSendError(!sent);
    if (sent) {
      setDraft('');
    }
  };

  return (
    <>
      <div className={styles.composer__replies}>
        <Button
          className={styles.composer__reply}
          size={ButtonSize.Sm}
          variant={ButtonVariant.Secondary}
          onClick={() => setDraft('Здравствуйте!')}
        >
          Здравствуйте!
        </Button>
        <Button
          className={styles.composer__reply}
          size={ButtonSize.Sm}
          variant={ButtonVariant.Secondary}
          onClick={() => setDraft('Когда можно посмотреть?')}
        >
          Когда можно посмотреть?
        </Button>
      </div>
      {sendError && (
        <Alert className={styles.composer__error} variant={AlertVariant.Error}>
          Не удалось отправить сообщение. Попробуйте ещё раз.
        </Alert>
      )}
      <form className={styles.composer__form} onSubmit={sendMessage}>
        <Input
          id={`${inputId}-message`}
          label="Сообщение"
          fieldClassName={styles.composer__field}
          autoComplete="off"
          maxLength={10000}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (sendError) {
              setSendError(false);
            }
          }}
          placeholder="Напишите сообщение"
        />
        <Button type={ButtonType.Submit} disabled={loading}>
          Отправить
        </Button>
      </form>
    </>
  );
}
