import type { AxiosInstance } from 'axios';
import axiosInstance from '@shared/api/client';
import { chatListSchema, type ChatListType } from '../model/chatList';

class ChatListService {
  constructor(private client: AxiosInstance) {}

  async getChatList(id: ChatListType['senderId']): Promise<ChatListType[]> {
    try {
      const res = await this.client.get<ChatListType[]>(`/users/${id}`);
      if (res.status !== 200) {
        throw new Error('Failed to get chat list');
      }
      return chatListSchema.array().parse(res.data);
    } catch (error) {
      console.log('unexpected error', error);
      return Promise.reject(new Error('Failed getting chat list'));
    }
  }

}

const chatListService = new ChatListService(axiosInstance);

export default chatListService;
