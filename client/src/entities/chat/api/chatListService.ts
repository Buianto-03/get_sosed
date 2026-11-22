import type { AxiosInstance } from 'axios';
import axiosInstance from '@shared/api/client';
import type { ReadOptions } from '@shared/api/cancellation';
import {
  chatListSchema,
  summarySchema,
  type UserSummary,
  type ChatListType,
} from '../model/chatListModel';

class ChatListService {
  constructor(private client: AxiosInstance) {}

  async getSummary(id: number, options?: ReadOptions): Promise<UserSummary> {
    const response = await this.client.get(`/users/${id}/summary`, options);
    return summarySchema.parse(response.data);
  }

  async getChatList(id: ChatListType['senderId'], options?: ReadOptions): Promise<ChatListType[]> {
    const res = await this.client.get<ChatListType[]>(`/users/${id}`, options);
    if (res.status !== 200) {
      throw new Error('Failed to get chat list');
    }
    return chatListSchema.array().parse(res.data);
  }
}

const chatListService = new ChatListService(axiosInstance);

export default chatListService;
