import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MessageComposer } from './MessageComposer';

describe('MessageComposer', () => {
  it('fills quick replies, keeps a rejected reply and sends only trimmed text', () => {
    const send = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<MessageComposer conversationId="2" onSendMessage={send} />);

    const input = screen.getByRole('textbox', { name: 'Сообщение' });
    const submit = screen.getByRole('button', { name: 'Отправить' });
    expect(input).toHaveAttribute('maxlength', '10000');
    expect(input).toHaveAttribute('autocomplete', 'off');
    fireEvent.click(screen.getByRole('button', { name: 'Здравствуйте!' }));
    expect(input).toHaveValue('Здравствуйте!');
    fireEvent.click(screen.getByRole('button', { name: 'Когда можно посмотреть?' }));
    expect(input).toHaveValue('Когда можно посмотреть?');
    expect(send).not.toHaveBeenCalled();

    fireEvent.click(submit);
    expect(send).toHaveBeenNthCalledWith(1, '2', 'Когда можно посмотреть?');
    expect(input).toHaveValue('Когда можно посмотреть?');
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось отправить');

    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(submit);
    expect(send).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: '  Благодарю!  ' } });
    fireEvent.click(submit);
    expect(send).toHaveBeenNthCalledWith(2, '2', 'Благодарю!');
    expect(input).toHaveValue('');
  });

  it('blocks direct submission during loading and retains the draft until sending is available', () => {
    const send = vi.fn().mockReturnValue(true);
    const { rerender } = render(
      <MessageComposer conversationId="2" loading onSendMessage={send} />,
    );
    const input = screen.getByRole('textbox', { name: 'Сообщение' });
    const submit = screen.getByRole('button', { name: 'Отправить' });
    const form = input.closest('form');
    if (!form) {
      throw new Error('Composer is missing');
    }

    fireEvent.change(input, { target: { value: 'Добрый день' } });
    expect(submit).toBeDisabled();
    fireEvent.submit(form);
    expect(send).not.toHaveBeenCalled();
    expect(input).toHaveValue('Добрый день');

    rerender(<MessageComposer conversationId="2" onSendMessage={send} />);
    expect(submit).toBeEnabled();
    expect(input).toHaveValue('Добрый день');
    fireEvent.click(submit);
    expect(send).toHaveBeenCalledWith('2', 'Добрый день');
    expect(input).toHaveValue('');
  });
});
