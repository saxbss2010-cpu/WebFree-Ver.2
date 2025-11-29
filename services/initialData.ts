
import { User, Post, Message } from '../types';

// Simple hash function matching the one in Login/SignUp
const simpleHash = (s: string) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

const INITIAL_USERS: User[] = [
    {
      id: 'user_admin_crax',
      username: 'crax',
      email: 'crax@gmail.com',
      passwordHash: simpleHash('Pcmg1234!'),
      avatar: 'https://ui-avatars.com/api/?name=Crax&background=dc2626&color=fff&bold=true',
      following: ['user_sarah_usa', 'user_hiro_jp'],
      followers: ['user_sarah_usa', 'user_lucas_br'],
      favorites: [],
      role: 'admin',
      isDonor: true,
    },
    {
      id: 'user_sarah_usa',
      username: 'sarah_nyc',
      email: 'sarah@example.com',
      passwordHash: simpleHash('password'),
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
      following: ['user_admin_crax'],
      followers: ['user_admin_crax', 'user_hiro_jp'],
      favorites: [],
      role: 'user',
    },
    {
      id: 'user_hiro_jp',
      username: 'hiro_tokyo',
      email: 'hiro@example.com',
      passwordHash: simpleHash('password'),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
      following: ['user_sarah_usa'],
      followers: ['user_admin_crax'],
      favorites: [],
      role: 'user',
    },
    {
      id: 'user_lucas_br',
      username: 'lucas_rio',
      email: 'lucas@example.com',
      passwordHash: simpleHash('password'),
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
      following: ['user_admin_crax'],
      followers: [],
      favorites: [],
      role: 'user',
    }
  ];

const INITIAL_POSTS: Post[] = [];

export const getInitialUsers = (): User[] => {
  return INITIAL_USERS;
};

export const getInitialPosts = (): Post[] => {
    return INITIAL_POSTS;
};

export const getInitialMessages = (): Message[] => {
    return [];
};