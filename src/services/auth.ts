import { User } from '../types';
import { db } from './db';

export const auth = {
  async login(email: string, password?: string): Promise<User | null> {
    const users = await db.getUsers();
    // In real app, we verify password hash. Here we just match strings.
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem('certifiq_current_user', JSON.stringify(user));
      return user;
    }
    return null;
  },
  
  logout(): void {
    localStorage.removeItem('certifiq_current_user');
  },
  
  getCurrentUser(): User | null {
    const data = localStorage.getItem('certifiq_current_user');
    return data ? JSON.parse(data) : null;
  }
};
