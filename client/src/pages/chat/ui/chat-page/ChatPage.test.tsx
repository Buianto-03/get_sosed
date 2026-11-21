/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '../chat-thread/ChatThread';
import { ChatPage, type ChatConversationRow } from './ChatPage';

const conversation: ChatConversationRow = {
  id: '2',
  name: 'Тестовый сосед',
  lastMessage: 'Привет',
};
const messages: ChatMessage[] = [{ id: '1', from: 'them', text: 'Старая история' }];
const actions = { messages, onSelectConversation: vi.fn(), onBackToList: vi.fn() };

describe('ChatPage accessibility', () => {
  it('retains a failed draft and clears it only when the socket accepts a retry', () => {
    const send = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(
      <ChatPage
        {...actions}
        conversations={[conversation]}
        selectedConversationId="2"
        onSendMessage={send}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Сообщение' });
    fireEvent.change(input, { target: { value: 'Здравствуйте' } });
    input.focus();
    const form = input.closest('form');
    if (!form) {
      throw new Error('Composer is missing');
    }
    fireEvent.submit(form);
    expect(input).toHaveValue('Здравствуйте');
    expect(input).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось отправить');
    fireEvent.submit(form);
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(send).toHaveBeenNthCalledWith(2, '2', 'Здравствуйте');
  });

  it('resets the draft and send error when switching conversations', () => {
    const send = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    const second = { ...conversation, id: '3', name: 'Другой собеседник' };
    const props = { ...actions, conversations: [conversation, second], onSendMessage: send };
    const { rerender } = render(<ChatPage {...props} selectedConversationId="2" />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), {
      target: { value: 'Сообщение первому собеседнику' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось отправить');

    rerender(<ChatPage {...props} selectedConversationId="3" />);
    const input = screen.getByRole('textbox', { name: 'Сообщение' });
    expect(input).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Сообщение второму собеседнику' } });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(send).toHaveBeenNthCalledWith(2, '3', 'Сообщение второму собеседнику');

    rerender(<ChatPage {...props} selectedConversationId="2" />);
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('announces only new incoming messages without moving focus or rereading on typing', () => {
    const props = { ...actions, selectedConversationId: '2', onSendMessage: () => true };
    const { rerender } = render(
      <ChatPage {...props} conversations={[conversation]} historyLoading />,
    );
    rerender(<ChatPage {...props} conversations={[conversation]} historyLoading={false} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    const input = screen.getByRole('textbox', { name: 'Сообщение' });
    input.focus();
    const updated: ChatMessage[] = [
      ...messages,
      { id: '2', from: 'them', text: 'Новое сообщение' },
    ];
    rerender(
      <ChatPage
        {...props}
        conversations={[conversation]}
        messages={updated}
        historyLoading={false}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Тестовый сосед: Новое сообщение');
    expect(screen.getByRole('status')).not.toHaveTextContent('Старая история');
    fireEvent.change(input, { target: { value: 'Ответ' } });
    expect(input).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Тестовый сосед: Новое сообщение');
    expect(screen.getByRole('region', { name: 'Сообщения' })).toHaveAttribute('tabindex', '0');
  });
});
