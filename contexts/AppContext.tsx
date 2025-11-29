
import React, { createContext, useState, useEffect, useCallback } from 'react';
// FIX: Import the Message type for the new messaging feature.
import { User, Post, Comment, Notification, Message } from '../types';
// FIX: Import initial messages data.
import { getInitialUsers, getInitialPosts, getInitialMessages } from '../services/initialData';
import { playLikeSound, playFollowSound } from '../services/audioService';

// Helper to get data from localStorage
const getStorageItem = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

// Helper to set data in localStorage
const setStorageItem = <T,>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key “${key}”:`, error);
  }
};


interface AppContextType {
  currentUser: User | null;
  users: User[];
  posts: Post[];
  notifications: Notification[];
  toast: { message: string, type: 'success' | 'error' } | null;
  searchQuery: string;
  login: (email: string, passwordHash: string) => boolean;
  logout: () => void;
  signup: (username: string, email: string, passwordHash: string) => boolean;
  createPost: (postData: Omit<Post, 'id' | 'userId' | 'likes' | 'comments' | 'timestamp'>) => void;
  toggleLike: (postId: string) => void;
  toggleFavorite: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  toggleFollow: (userIdToFollow: string) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  setSearchQuery: (query: string) => void;
  updateUserProfile: (data: { username: string; email: string }) => boolean;
  updatePassword: (passwordHash: string) => boolean;
  markNotificationsAsRead: () => void;
  updateUserAvatar: (avatarDataUrl: string) => void;
  deletePost: (postId: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  deleteUser: (userId: string) => void;
  // FIX: Add types for messaging feature.
  messages: Message[];
  sendMessage: (recipientId: string, text: string) => void;
  markMessagesAsRead: (senderId: string) => void;
  toggleUserBan: (userId: string) => void;
  toggleUserDonor: (userId: string) => void;
}

export const AppContext = createContext<AppContextType>(null!);

// Create a BroadcastChannel for real-time synchronization across tabs (Simulating a DB)
const dbChannel = new BroadcastChannel('webfree_db_sync');

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => getStorageItem('users', getInitialUsers()));
  const [posts, setPosts] = useState<Post[]>(() => getStorageItem('posts', getInitialPosts()));
  const [notifications, setNotifications] = useState<Notification[]>(() => getStorageItem('notifications', []));
  // FIX: Add state for messages.
  const [messages, setMessages] = useState<Message[]>(() => getStorageItem('messages', getInitialMessages()));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStorageItem('currentUser', null));
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist to localStorage whenever state changes
  useEffect(() => setStorageItem('users', users), [users]);
  useEffect(() => setStorageItem('posts', posts), [posts]);
  useEffect(() => setStorageItem('currentUser', currentUser), [currentUser]);
  useEffect(() => setStorageItem('notifications', notifications), [notifications]);
  useEffect(() => setStorageItem('messages', messages), [messages]);

  // Listen for DB updates from other "Nodes" (Tabs/Windows)
  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
        if (event.data === 'DB_UPDATE') {
            // Refresh state from storage to sync with other users/tabs
            setUsers(getStorageItem('users', getInitialUsers()));
            setPosts(getStorageItem('posts', getInitialPosts()));
            setNotifications(getStorageItem('notifications', []));
            setMessages(getStorageItem('messages', getInitialMessages()));
            
            // Note: We don't sync currentUser automatically to allow testing different users in different tabs
        }
    };
    dbChannel.addEventListener('message', handleSync);
    return () => dbChannel.removeEventListener('message', handleSync);
  }, []);

  // Helper to broadcast changes to the "network"
  const broadcastUpdate = () => {
    dbChannel.postMessage('DB_UPDATE');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const login = (email: string, passwordHash: string): boolean => {
    const user = users.find(u => u.email === email && u.passwordHash === passwordHash);
    if (user) {
      if (user.isBanned) {
        showToast('Your account has been banned.', 'error');
        return false;
      }
      setCurrentUser(user);
      showToast('Login successful!', 'success');
      return true;
    }
    showToast('Invalid email or password.', 'error');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Logged out successfully.', 'success');
  };

  const signup = (username: string, email: string, passwordHash: string): boolean => {
    if (users.some(u => u.username === username || u.email === email)) {
      showToast('Username or email already exists.', 'error');
      return false;
    }
    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      email,
      passwordHash,
      avatar: `https://picsum.photos/seed/${username}/200`,
      following: [],
      followers: [],
      favorites: [],
      role: 'user',
      isBanned: false,
      isDonor: false,
    };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    setCurrentUser(newUser);
    
    // Immediate persist for signup to ensure other tabs see the new user
    setStorageItem('users', newUsers); 
    broadcastUpdate();

    showToast('Account created successfully!', 'success');
    return true;
  };

  const createPost = (postData: Omit<Post, 'id' | 'userId' | 'likes' | 'comments' | 'timestamp'>) => {
    if (!currentUser) {
        showToast('You must be logged in to post.', 'error');
        return;
    }
    const newPost: Post = {
      ...postData,
      id: `post_${Date.now()}`,
      userId: currentUser.id,
      likes: [],
      comments: [],
      timestamp: new Date().toISOString(),
    };
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);

    // Create notifications for followers
    const author = users.find(u => u.id === currentUser.id);
    let updatedNotifications = [...notifications];
    
    if(author?.followers) {
        const newNotifications: Notification[] = author.followers.map(followerId => ({
            id: `notif_${Date.now()}_${followerId}`,
            recipientId: followerId,
            actorId: currentUser.id,
            type: 'NEW_POST',
            postId: newPost.id,
            timestamp: new Date().toISOString(),
            read: false,
        }));
        updatedNotifications = [...notifications, ...newNotifications];
        setNotifications(updatedNotifications);
    }
    
    // Immediate persist and broadcast
    setStorageItem('posts', updatedPosts);
    setStorageItem('notifications', updatedNotifications);
    broadcastUpdate();

    showToast('Post created successfully!', 'success');
  };

  const toggleLike = (postId: string) => {
    if (!currentUser) {
        showToast('You must be logged in to like posts.', 'error');
        return;
    }
    
    const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          const isLiked = post.likes.includes(currentUser.id);
          if (!isLiked) {
            playLikeSound();
          }
          const newLikes = isLiked
            ? post.likes.filter(id => id !== currentUser.id)
            : [...post.likes, currentUser.id];
          return { ...post, likes: newLikes };
        }
        return post;
      });
      
    setPosts(updatedPosts);
    setStorageItem('posts', updatedPosts);
    broadcastUpdate();
  };
  
  const toggleFavorite = (postId: string) => {
    if (!currentUser) {
      showToast('You must be logged in to favorite posts.', 'error');
      return;
    }
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex === -1) return;

    const userToUpdate = users[userIndex];
    const isFavorited = userToUpdate.favorites.includes(postId);

    const updatedUser = {
    ...userToUpdate,
    favorites: isFavorited
        ? userToUpdate.favorites.filter(id => id !== postId)
        : [...userToUpdate.favorites, postId],
    };

    const newUsers = [...users];
    newUsers[userIndex] = updatedUser;

    setUsers(newUsers);
    setCurrentUser(updatedUser);
    
    setStorageItem('users', newUsers);
    broadcastUpdate();
  };

  const addComment = (postId: string, text: string) => {
    if (!currentUser) {
      showToast('You must be logged in to comment.', 'error');
      return;
    }
    const newComment: Comment = {
        id: `comment_${Date.now()}`,
        userId: currentUser.id,
        text,
        timestamp: new Date().toISOString(),
    };
    
    const updatedPosts = posts.map(post =>
        post.id === postId ? { ...post, comments: [...post.comments, newComment].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) } : post
    );
    
    setPosts(updatedPosts);
    setStorageItem('posts', updatedPosts);
    broadcastUpdate();
  };

  const toggleFollow = useCallback((userIdToFollow: string) => {
    if (!currentUser) {
        showToast('You must be logged in to follow users.', 'error');
        return;
    }
    if (currentUser.id === userIdToFollow) return;

    const newUsers = [...users];
    const userIndex = newUsers.findIndex(u => u.id === currentUser.id);
    const targetUserIndex = newUsers.findIndex(u => u.id === userIdToFollow);

    if(userIndex === -1 || targetUserIndex === -1) return;

    const isFollowing = newUsers[userIndex].following.includes(userIdToFollow);
    
    if (!isFollowing) {
        playFollowSound();
    }

    if(isFollowing) {
        newUsers[userIndex].following = newUsers[userIndex].following.filter(id => id !== userIdToFollow);
        newUsers[targetUserIndex].followers = newUsers[targetUserIndex].followers.filter(id => id !== currentUser.id);
    } else {
        newUsers[userIndex].following.push(userIdToFollow);
        newUsers[targetUserIndex].followers.push(currentUser.id);
    }
    
    setUsers(newUsers);
    setCurrentUser(newUsers[userIndex]);
    
    setStorageItem('users', newUsers);
    broadcastUpdate();

  }, [currentUser, users, showToast]);

  const updateUserProfile = (data: { username: string, email: string }) => {
    if (!currentUser) return false;

    if (users.some(u => u.id !== currentUser.id && (u.username === data.username || u.email === data.email))) {
        showToast('Username or email is already taken.', 'error');
        return false;
    }

    const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, ...data } : u);
    setUsers(updatedUsers);
    
    const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser.id)!;
    setCurrentUser(updatedCurrentUser);

    setStorageItem('users', updatedUsers);
    broadcastUpdate();
    
    showToast('Profile updated successfully!', 'success');
    return true;
  };

  const updatePassword = (passwordHash: string) => {
     if (!currentUser) return false;

     const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, passwordHash } : u);
     setUsers(updatedUsers);
     
     const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser.id)!;
     setCurrentUser(updatedCurrentUser);
 
     setStorageItem('users', updatedUsers);
     broadcastUpdate();

     showToast('Password updated successfully!', 'success');
     return true;
  };
  
  const updateUserAvatar = (avatarDataUrl: string) => {
    if (!currentUser) return;

    const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, avatar: avatarDataUrl } : u);
    setUsers(updatedUsers);
    
    const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser.id)!;
    setCurrentUser(updatedCurrentUser);
    
    setStorageItem('users', updatedUsers);
    broadcastUpdate();
  };

  const markNotificationsAsRead = () => {
    if (!currentUser) return;
    const updatedNotifications = notifications.map(n => 
        n.recipientId === currentUser.id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    
    setStorageItem('notifications', updatedNotifications);
    broadcastUpdate();
  };
  
  const deletePost = (postId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('You do not have permission to delete posts.', 'error');
      return;
    }
    const updatedPosts = posts.filter(p => p.id !== postId);
    setPosts(updatedPosts);
    
    setStorageItem('posts', updatedPosts);
    broadcastUpdate();
    
    showToast('Post deleted successfully.', 'success');
  };

  const deleteComment = (postId: string, commentId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('You do not have permission to delete comments.', 'error');
      return;
    }
    const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return { ...post, comments: post.comments.filter(c => c.id !== commentId) };
        }
        return post;
    });
    setPosts(updatedPosts);
    
    setStorageItem('posts', updatedPosts);
    broadcastUpdate();
    
    showToast('Comment deleted successfully.', 'success');
  };

  const deleteUser = (userId: string) => {
    if (!currentUser) return;

    if (currentUser.role !== 'admin' && currentUser.id !== userId) {
      showToast('You do not have permission to delete this user.', 'error');
      return;
    }

    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      showToast('User not found.', 'error');
      return;
    }

    const postIdsToDelete = posts.filter(p => p.userId === userId).map(p => p.id);

    const updatedPosts = posts
        .filter(p => p.userId !== userId)
        .map(p => ({
          ...p,
          likes: p.likes.filter(likeUserId => likeUserId !== userId),
          comments: p.comments.filter(comment => comment.userId !== userId),
        }));
    setPosts(updatedPosts);

    const updatedUsers = users
        .filter(u => u.id !== userId)
        .map(u => ({
          ...u,
          following: u.following.filter(id => id !== userId),
          followers: u.followers.filter(id => id !== userId),
          favorites: u.favorites.filter(postId => !postIdsToDelete.includes(postId)),
        }));
    setUsers(updatedUsers);

    const updatedNotifications = notifications.filter(n => n.actorId !== userId && n.recipientId !== userId);
    setNotifications(updatedNotifications);

    const updatedMessages = messages.filter(m => m.senderId !== userId && m.recipientId !== userId);
    setMessages(updatedMessages);
    
    if (currentUser.id !== userId) {
        const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser.id);
        if (updatedCurrentUser) {
            setCurrentUser(updatedCurrentUser);
        }
    }

    setStorageItem('users', updatedUsers);
    setStorageItem('posts', updatedPosts);
    setStorageItem('notifications', updatedNotifications);
    setStorageItem('messages', updatedMessages);
    broadcastUpdate();

    if (currentUser.id === userId) {
      setCurrentUser(null);
      showToast('Your account has been deleted.', 'success');
    } else {
      showToast(`User '${userToDelete.username}' and all their content has been deleted.`, 'success');
    }
  };

  // FIX: Implement sendMessage function.
  const sendMessage = (recipientId: string, text: string) => {
    if (!currentUser) {
      showToast('You must be logged in to send messages.', 'error');
      return;
    }
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      recipientId,
      text,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    setStorageItem('messages', updatedMessages);
    broadcastUpdate();
  };

  // FIX: Implement markMessagesAsRead function.
  const markMessagesAsRead = (senderId: string) => {
    if (!currentUser) return;
    const updatedMessages = messages.map(m =>
        m.recipientId === currentUser.id && m.senderId === senderId && !m.read
          ? { ...m, read: true }
          : m
      );
    setMessages(updatedMessages);
    
    setStorageItem('messages', updatedMessages);
    broadcastUpdate();
  };
  
  const toggleUserBan = (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
         showToast('Unauthorized', 'error');
         return;
    }
    if (userId === currentUser.id) {
        showToast('You cannot ban yourself', 'error');
        return;
    }
    
    let isBanned = false;
    
    const updatedUsers = users.map(user => {
            if (user.id === userId) {
                isBanned = !user.isBanned;
                return { ...user, isBanned: isBanned };
            }
            return user;
        });
    setUsers(updatedUsers);
    
    setStorageItem('users', updatedUsers);
    broadcastUpdate();
    
    const user = users.find(u => u.id === userId);
    if (user) {
        showToast(`User ${user.username} has been ${user.isBanned ? 'unbanned' : 'banned'}.`, 'success');
    }
  };

  const toggleUserDonor = (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
         showToast('Unauthorized', 'error');
         return;
    }
    
    let isDonor = false;
    
    const updatedUsers = users.map(user => {
            if (user.id === userId) {
                isDonor = !user.isDonor;
                return { ...user, isDonor: isDonor };
            }
            return user;
        });
    setUsers(updatedUsers);
    
    setStorageItem('users', updatedUsers);
    broadcastUpdate();
    
    const user = users.find(u => u.id === userId);
    if (user) {
        showToast(`User ${user.username} ${isDonor ? 'is now a donor' : 'is no longer a donor'}.`, 'success');
    }
  };

  return (
    <AppContext.Provider value={{ 
        currentUser, users, posts, notifications, toast, messages,
        login, logout, signup, createPost, toggleLike, addComment, 
        toggleFollow, showToast, searchQuery, setSearchQuery,
        updateUserProfile, updatePassword, markNotificationsAsRead,
        updateUserAvatar, toggleFavorite, deletePost, deleteComment, deleteUser,
        sendMessage, markMessagesAsRead, toggleUserBan, toggleUserDonor
    }}>
      {children}
    </AppContext.Provider>
  );
};