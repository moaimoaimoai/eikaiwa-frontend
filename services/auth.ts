import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import api, { BASE_URL } from './api';
import { User, AuthTokens } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await axios.post(`${BASE_URL}/api/auth/login/`, { email, password });
    const { access, refresh, user } = response.data;

    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);

    return { user, tokens: { access, refresh } };
  },

  async register(data: {
    email: string;
    username: string;
    display_name: string;
    password: string;
    password_confirm: string;
    level: string;
  }): Promise<User> {
    const response = await axios.post(`${BASE_URL}/api/auth/register/`, data);
    return response.data.user;
  },

  async logout() {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  },

  async getStoredTokens(): Promise<AuthTokens | null> {
    const access = await SecureStore.getItemAsync('access_token');
    const refresh = await SecureStore.getItemAsync('refresh_token');
    if (access && refresh) return { access, refresh };
    return null;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch('/auth/profile/', data);
    return response.data;
  },

  async getStats() {
    const response = await api.get('/auth/stats/');
    return response.data;
  },
};
