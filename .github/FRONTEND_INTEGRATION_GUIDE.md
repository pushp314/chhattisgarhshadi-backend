# Frontend Integration Guide - Chhattisgarh Shaadi App

## 🎯 Backend Status: ✅ 100% READY

**Backend URL (Development):**
- **Web/iOS Simulator:** `http://localhost:8080`
- **Android Emulator:** `http://10.0.2.2:8080` ⚠️ **IMPORTANT!**
- **Physical Device:** `http://YOUR_LOCAL_IP:8080` (e.g., `http://192.168.1.100:8080`)

**API Base Path:** `/api`  
**Socket.io Base:** Same as backend URL

> **⚠️ Critical Note for Android Emulator:** Android Studio emulator uses `10.0.2.2` to access the host machine's localhost. This is NOT optional - `localhost` will NOT work on Android emulator!

---

## 🌐 API URL Configuration (MUST READ!)

### Why Different URLs?

Android emulator runs in a virtualized environment with its own network stack. When you use `localhost` in Android emulator, it refers to the emulator itself, NOT your computer. That's why we need `10.0.2.2` - it's a special alias that routes to your host machine's localhost.

### Platform-Specific URLs

| Platform | API URL | Socket URL | Notes |
|----------|---------|------------|-------|
| **Android Emulator** | `http://10.0.2.2:8080` | `http://10.0.2.2:8080` | Special IP for host machine |
| **iOS Simulator** | `http://localhost:8080` | `http://localhost:8080` | Shares host's network |
| **Physical Device** | `http://192.168.x.x:8080` | `http://192.168.x.x:8080` | Use your computer's local IP |
| **Production** | `https://api.yourdomain.com` | `https://api.yourdomain.com` | Deployed backend |

### Recommended Configuration File

Create `src/config/api.js`:

```javascript
// src/config/api.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Get API URL based on platform and device type
 * - Android Emulator: 10.0.2.2 (special alias for host's localhost)
 * - iOS Simulator: localhost (shares host's network)
 * - Physical Device: Your computer's local IP or production URL
 */
const getApiUrl = () => {
  // If running on a physical device
  if (Constants.isDevice) {
    // Production: return your deployed backend URL
    return 'https://api.yourdomain.com';
    
    // Development on physical device: use your computer's local IP
    // Find it using: ipconfig (Windows) or ifconfig (Mac/Linux)
    // return 'http://192.168.1.100:8080';
  }
  
  // Emulator/Simulator
  return Platform.select({
    android: 'http://10.0.2.2:8080',    // ✅ Android Emulator MUST use this!
    ios: 'http://localhost:8080',        // ✅ iOS Simulator can use localhost
    default: 'http://localhost:8080'
  });
};

export const API_URL = getApiUrl();
export const SOCKET_URL = API_URL; // Socket.io uses same URL

console.log('📡 API URL:', API_URL); // Debug log to verify correct URL

// Usage example:
// import { API_URL } from './config/api';
// fetch(`${API_URL}/api/auth/google`, ...)
```

### Finding Your Local IP (Physical Devices)

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Look for something like: inet 192.168.1.100
```

**Windows:**
```bash
ipconfig | findstr IPv4
# Look for something like: IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

**Alternative (any OS):**
```bash
# Visit this in your browser:
http://www.whatismyip.com/what-is-my-local-ip-address/
```

---

## 📋 Quick Setup Checklist

### ✅ What's Already Done (Backend)

1. ✅ Google OAuth with authorization code exchange
2. ✅ Profile CRUD endpoints (5 endpoints)
3. ✅ Match requests API (7 endpoints)
4. ✅ Messaging API (6 endpoints)
5. ✅ Search/Filters API with advanced filtering
6. ✅ Socket.io real-time messaging
7. ✅ File upload for profile photos
8. ✅ Notifications API (6 endpoints)
9. ✅ Payment integration (Razorpay)
10. ✅ Phone OTP verification

### 📱 What Frontend Needs to Do

1. Setup API URL configuration (see above)
2. Implement Web-Based OAuth flow (Google Sign-In)
3. Store JWT tokens securely (accessToken, refreshToken)
4. Connect to Socket.io for real-time features
5. Build UI screens for all features
6. Handle file uploads (profile photos)
7. Test on Android Emulator (verify 10.0.2.2 works)

---

## 🔐 Authentication Flow

### Step 1: Google Sign-In (Web-Based OAuth)

**Frontend Implementation:**

```javascript
// screens/LoginScreen.js
import React from 'react';
import { Button, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID',
    webClientId: '250704044564-q3ql66oruro0a17ipumla9cloda24tkk.apps.googleusercontent.com',
    redirectUri: 'http://localhost:8080/auth/google/callback',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response.authentication);
    }
  }, [response]);

  const handleGoogleSignIn = async (authentication) => {
    try {
      console.log('🔐 Signing in with Google...');
      console.log('📡 Using API URL:', API_URL);

      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorizationCode: authentication.accessToken,
          redirectUri: 'http://localhost:8080/auth/google/callback',
          deviceInfo: {
            deviceId: Constants.deviceId || 'unknown',
            deviceName: Constants.deviceName || 'Unknown Device',
            deviceType: Platform.OS, // 'android' or 'ios'
          }
        })
      });

      const data = await response.json();
      console.log('✅ Auth response:', data);

      if (data.success) {
        // Store tokens securely
        await AsyncStorage.setItem('accessToken', data.data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));

        // Navigate to app
        navigation.replace(data.data.isNewUser ? 'CreateProfile' : 'Home');
      } else {
        Alert.alert('Login Failed', data.message || 'Please try again');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', 'Network request failed. Check your connection.');
    }
  };

  return (
    <Button
      title="Sign in with Google"
      disabled={!request}
      onPress={() => promptAsync()}
    />
  );
}
```

**Backend Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "profilePicture": "https://...",
      "role": "USER",
      "isPhoneVerified": false,
      "isActive": true,
      "preferredLanguage": "EN",
      "profile": null,
      "createdAt": "2025-11-14T...",
      "updatedAt": "2025-11-14T..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m",
    "isNewUser": true
  },
  "message": "Account created successfully",
  "success": true
}
```

---

## 🔌 API Endpoints Reference

### Creating API Service Layer

```javascript
// services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

class ApiService {
  constructor() {
    this.baseURL = API_URL;
  }

  async getHeaders() {
    const token = await AsyncStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers }
      });

      const data = await response.json();

      // Handle token refresh on 401
      if (response.status === 401 && !endpoint.includes('/auth/')) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry request with new token
          return this.request(endpoint, options);
        }
        throw new Error('Session expired. Please login again.');
      }

      if (!data.success && response.status >= 400) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      if (data.success) {
        await AsyncStorage.setItem('accessToken', data.data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Auth endpoints
  async googleAuth(authorizationCode, redirectUri, deviceInfo) {
    return this.request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ authorizationCode, redirectUri, deviceInfo })
    });
  }

  async logout() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    await this.request('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }

  // Profile endpoints
  async getMyProfile() {
    return this.request('/api/profile/me');
  }

  async createProfile(profileData) {
    return this.request('/api/profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  }

  async updateProfile(profileData) {
    return this.request('/api/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async getProfile(userId) {
    return this.request(`/api/profile/${userId}`);
  }

  // Match endpoints
  async sendMatchRequest(receiverId, message) {
    return this.request('/api/matches', {
      method: 'POST',
      body: JSON.stringify({ receiverId, message })
    });
  }

  async acceptMatch(matchId) {
    return this.request(`/api/matches/${matchId}/accept`, {
      method: 'POST'
    });
  }

  async rejectMatch(matchId) {
    return this.request(`/api/matches/${matchId}/reject`, {
      method: 'POST'
    });
  }

  async getSentMatches(page = 1, limit = 10, status) {
    const params = new URLSearchParams({ page, limit, ...(status && { status }) });
    return this.request(`/api/matches/sent?${params}`);
  }

  async getReceivedMatches(page = 1, limit = 10, status) {
    const params = new URLSearchParams({ page, limit, ...(status && { status }) });
    return this.request(`/api/matches/received?${params}`);
  }

  async getAcceptedMatches(page = 1, limit = 10) {
    const params = new URLSearchParams({ page, limit });
    return this.request(`/api/matches/accepted?${params}`);
  }

  // Message endpoints
  async sendMessage(receiverId, content) {
    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content })
    });
  }

  async getConversation(userId, page = 1, limit = 50) {
    const params = new URLSearchParams({ page, limit });
    return this.request(`/api/messages/${userId}?${params}`);
  }

  async getAllConversations() {
    return this.request('/api/messages/conversations');
  }

  async markMessagesAsRead(userId) {
    return this.request(`/api/messages/${userId}/read`, {
      method: 'PUT'
    });
  }

  async getUnreadCount() {
    return this.request('/api/messages/unread-count');
  }

  // Search endpoint
  async searchUsers(filters = {}, page = 1, limit = 20) {
    const params = new URLSearchParams({ ...filters, page, limit });
    return this.request(`/api/users/search?${params}`);
  }

  // File upload
  async uploadProfilePhoto(imageUri) {
    const formData = new FormData();
    formData.append('photo', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg'
    });

    const token = await AsyncStorage.getItem('accessToken');
    const response = await fetch(`${this.baseURL}/api/upload/profile-photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    });

    return response.json();
  }
}

export default new ApiService();
```

---

## 🔌 Socket.io Real-Time Integration

### Setup Socket Service

```javascript
// services/socket.js
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '../config/api';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  async connect() {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      console.error('❌ No access token found');
      return;
    }

    console.log('🔌 Connecting to Socket.io:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Message events
  onMessageReceived(callback) {
    if (!this.socket) return;
    this.socket.on('message:received', callback);
  }

  sendMessage(receiverId, content, callback) {
    if (!this.socket) return;
    this.socket.emit('message:send', { receiverId, content }, callback);
  }

  markAsRead(userId) {
    if (!this.socket) return;
    this.socket.emit('message:read', { userId });
  }

  onMessageRead(callback) {
    if (!this.socket) return;
    this.socket.on('message:read', callback);
  }

  // Typing indicators
  startTyping(receiverId) {
    if (!this.socket) return;
    this.socket.emit('typing:started', { receiverId });
  }

  stopTyping(receiverId) {
    if (!this.socket) return;
    this.socket.emit('typing:stopped', { receiverId });
  }

  onTypingStarted(callback) {
    if (!this.socket) return;
    this.socket.on('typing:started', callback);
  }

  onTypingStopped(callback) {
    if (!this.socket) return;
    this.socket.on('typing:stopped', callback);
  }

  // Presence
  onUserOnline(callback) {
    if (!this.socket) return;
    this.socket.on('user:online', callback);
  }

  onUserOffline(callback) {
    if (!this.socket) return;
    this.socket.on('user:offline', callback);
  }

  // Notifications
  onNotification(callback) {
    if (!this.socket) return;
    this.socket.on('notification:new', callback);
  }
}

export default new SocketService();
```

### Using Socket Service in Chat Screen

```javascript
// screens/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';
import socketService from '../services/socket';
import apiService from '../services/api';

export default function ChatScreen({ route }) {
  const { otherUser } = route.params; // { id, name, profilePicture }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Connect socket
    socketService.connect();

    // Load conversation history
    loadMessages();

    // Listen for incoming messages
    socketService.onMessageReceived((message) => {
      if (message.senderId === otherUser.id) {
        setMessages(prev => [...prev, message]);
        // Auto-scroll to bottom
      }
    });

    // Listen for typing indicators
    socketService.onTypingStarted((data) => {
      if (data.userId === otherUser.id) {
        setIsTyping(true);
      }
    });

    socketService.onTypingStopped((data) => {
      if (data.userId === otherUser.id) {
        setIsTyping(false);
      }
    });

    // Listen for read receipts
    socketService.onMessageRead((data) => {
      if (data.byUser === otherUser.id) {
        setMessages(prev =>
          prev.map(msg => ({ ...msg, isRead: true }))
        );
      }
    });

    return () => {
      socketService.stopTyping(otherUser.id);
    };
  }, [otherUser.id]);

  const loadMessages = async () => {
    try {
      const response = await apiService.getConversation(otherUser.id, 1, 50);
      if (response.success) {
        setMessages(response.data.messages);
        // Mark as read
        await apiService.markMessagesAsRead(otherUser.id);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    socketService.sendMessage(otherUser.id, newMessage, (response) => {
      if (response.success) {
        setMessages(prev => [...prev, response.message]);
        setNewMessage('');
        socketService.stopTyping(otherUser.id);
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    });
  };

  const handleTyping = (text) => {
    setNewMessage(text);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing started
    if (text.length > 0) {
      socketService.startTyping(otherUser.id);
      
      // Auto-stop typing after 3 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(otherUser.id);
      }, 3000);
    } else {
      socketService.stopTyping(otherUser.id);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={{
            alignSelf: item.senderId === otherUser.id ? 'flex-start' : 'flex-end',
            backgroundColor: item.senderId === otherUser.id ? '#f0f0f0' : '#007AFF',
            padding: 10,
            margin: 5,
            borderRadius: 10
          }}>
            <Text style={{
              color: item.senderId === otherUser.id ? '#000' : '#fff'
            }}>
              {item.content}
            </Text>
            {item.senderId !== otherUser.id && (
              <Text style={{ fontSize: 10, color: '#fff', opacity: 0.7 }}>
                {item.isRead ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        )}
        keyExtractor={item => item.id.toString()}
      />
      
      {isTyping && (
        <Text style={{ padding: 10, fontStyle: 'italic', color: '#666' }}>
          {otherUser.name} is typing...
        </Text>
      )}
      
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <TextInput
          value={newMessage}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          style={{ flex: 1, borderWidth: 1, borderRadius: 20, padding: 10 }}
        />
        <Button title="Send" onPress={handleSendMessage} />
      </View>
    </View>
  );
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Network request failed" on Android Emulator

**Problem:** Using `http://localhost:8080` on Android

**Solution:**
```javascript
// ❌ WRONG - doesn't work on Android Emulator
const API_URL = 'http://localhost:8080';

// ✅ CORRECT - use 10.0.2.2 for Android Emulator
const API_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080'
});
```

### Issue 2: "Failed to connect to /10.0.2.2:8080"

**Solutions:**
1. **Ensure backend is running:** Check terminal shows "Server running on port 8080"
2. **Check firewall:** Allow port 8080 through firewall
3. **Verify IP:** On Android emulator, `10.0.2.2` is correct (not `localhost`)
4. **Clear cache:** `npm start -- --reset-cache` in React Native
5. **Check CORS:** Backend should allow `*` or your app's origin

### Issue 3: Socket.io not connecting

**Solutions:**
```javascript
// Ensure you're using the correct URL
const SOCKET_URL = Platform.select({
  android: 'http://10.0.2.2:8080',  // Not localhost!
  ios: 'http://localhost:8080'
});

// Use websocket transport
const socket = io(SOCKET_URL, {
  transports: ['websocket'], // Important!
  auth: { token: yourToken }
});
```

### Issue 4: "401 Unauthorized"

**Solutions:**
1. Check token exists: `await AsyncStorage.getItem('accessToken')`
2. Check token format: `Bearer ${token}` in Authorization header
3. Token expired: Implement refresh token logic
4. Check backend logs for specific error

### Issue 5: Physical device can't connect

**Solutions:**
1. **Use local IP instead of localhost:**
   ```javascript
   // Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
   const API_URL = 'http://192.168.1.100:8080'; // Your actual IP
   ```
2. **Ensure device on same WiFi** as your computer
3. **Check firewall** allows incoming connections on port 8080

---

## 📚 Complete API Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/api/auth/google` | ❌ | `{ authorizationCode, redirectUri, deviceInfo }` | User + Tokens |
| POST | `/api/auth/refresh` | ❌ | `{ refreshToken }` | New Tokens |
| POST | `/api/auth/logout` | ✅ | `{ refreshToken? }` | Success |
| POST | `/api/auth/send-otp` | ✅ | `{ phone, countryCode? }` | OTP Sent |
| POST | `/api/auth/verify-otp` | ✅ | `{ phone, otp }` | Phone Verified |

### Profile Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/profile` | ✅ | Create profile (required after first login) |
| GET | `/api/profile/me` | ✅ | Get current user's profile |
| PUT | `/api/profile/me` | ✅ | Update current user's profile |
| DELETE | `/api/profile/me` | ✅ | Soft delete profile |
| GET | `/api/profile/:userId` | ✅ | Get another user's profile |

### Match Request Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/matches` | ✅ | Send match request (body: `{ receiverId, message? }`) |
| POST | `/api/matches/:matchId/accept` | ✅ | Accept match request |
| POST | `/api/matches/:matchId/reject` | ✅ | Reject match request |
| GET | `/api/matches/sent?page=1&limit=10&status=PENDING` | ✅ | Get sent requests |
| GET | `/api/matches/received?page=1&limit=10` | ✅ | Get received requests |
| GET | `/api/matches/accepted?page=1&limit=10` | ✅ | Get accepted matches |
| DELETE | `/api/matches/:matchId` | ✅ | Delete/cancel match |

### Message Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/messages` | ✅ | Send message (body: `{ receiverId, content }`) |
| GET | `/api/messages/conversations` | ✅ | Get all conversations |
| GET | `/api/messages/:userId?page=1&limit=50` | ✅ | Get conversation with user |
| PUT | `/api/messages/:userId/read` | ✅ | Mark messages as read |
| GET | `/api/messages/unread-count` | ✅ | Get unread message count |
| DELETE | `/api/messages/:messageId` | ✅ | Delete message |

### Search Endpoint

| Method | Endpoint | Auth | Query Parameters |
|--------|----------|------|------------------|
| GET | `/api/users/search` | ✅ | `minAge, maxAge, gender, religion, nativeDistrict, speaksChhattisgarhi, minHeight, maxHeight, education, maritalStatus, page, limit` |

### Upload Endpoints

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/upload/profile-photo` | ✅ | FormData with `photo` | Upload single profile photo |
| POST | `/api/upload/profile-photos` | ✅ | FormData with `photos[]` | Upload multiple photos (max 5) |
| POST | `/api/upload/document` | ✅ | FormData with `document` | Upload ID/verification document |

### Notification Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications?page=1&limit=20` | ✅ | Get notifications |
| GET | `/api/notifications/unread-count` | ✅ | Get unread count |
| PUT | `/api/notifications/read-all` | ✅ | Mark all as read |
| PUT | `/api/notifications/:id/read` | ✅ | Mark one as read |
| DELETE | `/api/notifications` | ✅ | Delete all |
| DELETE | `/api/notifications/:id` | ✅ | Delete one |

---

## 🎨 Data Models (TypeScript)

```typescript
// User
interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isPhoneVerified: boolean;
  isActive: boolean;
  preferredLanguage: 'EN' | 'HI' | 'CG';
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
}

// Profile
interface Profile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  religion: 'HINDU' | 'MUSLIM' | 'CHRISTIAN' | 'SIKH' | 'BUDDHIST' | 'JAIN' | 'OTHER';
  caste: string;
  height: number; // in cm
  nativeDistrict: string;
  speaksChhattisgarhi: boolean;
  about: string;
  media?: Media[];
}

// Match Request
interface MatchRequest {
  id: number;
  senderId: number;
  receiverId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
  sender?: User;
  receiver?: User;
}

// Message
interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

// Media
interface Media {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  type: 'PROFILE_PHOTO' | 'GALLERY_PHOTO' | 'DOCUMENT';
  isProfilePicture: boolean; // Maps from isDefault in backend
}
```

---

## ✅ Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Create `src/config/api.js` with platform-specific URLs
- [ ] Install dependencies: `socket.io-client`, `@react-native-async-storage/async-storage`
- [ ] Create `services/api.js` for API calls
- [ ] Create `services/socket.js` for Socket.io
- [ ] Test API connection from Android Emulator (verify 10.0.2.2 works)

### Phase 2: Authentication (Day 2-3)
- [ ] Setup Google OAuth with `expo-auth-session`
- [ ] Build Login/Signup screen
- [ ] Implement token storage with AsyncStorage
- [ ] Implement auto-refresh token logic
- [ ] Test login flow on both platforms

### Phase 3: Profile (Day 4-5)
- [ ] Create Profile Creation screen (for new users)
- [ ] Build Profile Edit screen
- [ ] Implement image picker and upload
- [ ] Add form validation
- [ ] Test profile CRUD operations

### Phase 4: Discovery (Day 6-7)
- [ ] Build Search/Discovery screen
- [ ] Implement filter UI (age, location, etc.)
- [ ] Add user cards with swipe/like
- [ ] Test search with various filters

### Phase 5: Matching (Day 8-9)
- [ ] Build Match Requests screen (sent/received)
- [ ] Implement accept/reject actions
- [ ] Build Matches screen (accepted connections)
- [ ] Add match request notifications

### Phase 6: Messaging (Day 10-12)
- [ ] Setup Socket.io connection
- [ ] Build Conversations list screen
- [ ] Build Chat screen with real-time updates
- [ ] Add typing indicators
- [ ] Add read receipts
- [ ] Test real-time messaging

### Phase 7: Additional Features (Day 13-14)
- [ ] Build Notifications screen
- [ ] Implement push notifications (optional)
- [ ] Add user settings/preferences
- [ ] Implement payment flow (Razorpay)
- [ ] Add phone OTP verification

### Phase 8: Polish & Testing (Day 15+)
- [ ] Test on Android Emulator (10.0.2.2)
- [ ] Test on iOS Simulator (localhost)
- [ ] Test on physical devices (local IP)
- [ ] Handle edge cases and errors
- [ ] Add loading states and error messages
- [ ] Performance optimization
- [ ] Final QA

---

## 📚 Additional Resources

- **Backend Repository:** Current repo
- **API Documentation:** `.github/API_DOCUMENTATION.md`
- **OAuth Guide:** `.github/WEB_OAUTH_MIGRATION_GUIDE.md`
- **Copilot Instructions:** `.github/copilot-instructions.md`
- **Socket.io Docs:** https://socket.io/docs/v4/client-api/
- **Expo Docs:** https://docs.expo.dev/

---

## 🚀 Quick Test Script

Test your connection from React Native:

```javascript
// Test API connection
const testConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Backend connection successful:', data);
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    console.error('Check:');
    console.error('1. Backend running on port 8080?');
    console.error('2. Using correct URL for platform?');
    console.error('   - Android Emulator: http://10.0.2.2:8080');
    console.error('   - iOS Simulator: http://localhost:8080');
  }
};

// Call this on app start
useEffect(() => {
  testConnection();
}, []);
```

---

**Backend Status:** ✅ 100% READY  
**Last Updated:** 2025-11-14  
**Ready for React Native Integration!** 🚀

For questions or issues, check backend logs or contact the backend team.
