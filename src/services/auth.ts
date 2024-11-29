import type { User } from '../types';

// Demo users
const demoUsers = [
  {
    id: '1',
    email: 'admin@demo.com',
    password: 'demo123',
    name: 'Admin',
    role: 'admin' as const
  }
];

export const signIn = async (email: string, password: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const user = demoUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Credenziali non valide');
  }

  const { password: _, ...userWithoutPassword } = user;
  const token = btoa(JSON.stringify(userWithoutPassword)); // Simple token generation

  return {
    user: userWithoutPassword,
    token
  };
};

export const signOut = async () => {
  // Just clear the local state
  return Promise.resolve();
};