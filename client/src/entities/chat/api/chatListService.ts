import type { AxiosInstance } from 'axios';
import axiosInstance from '@shared/api/client';
import { chatListSchema, summarySchema, type UserSummary, type ChatListType } from '../model/chatListModel';

class ChatListService {
  constructor(private client: AxiosInstance) {}

  async getSummary(id: number): Promise<UserSummary> {
    const response = await this.client.get(`/users/${id}/summary`);
    return summarySchema.parse(response.data);
  }

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
