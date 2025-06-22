export const AUTH_CONSTANTS = {
  API_URL: 'https://myapp-r4xt.onrender.com',
  
  // LocalStorage keys
  STORAGE_KEYS: {
    LOGGED_IN: 'loggedIn',
    ACCESS_TOKEN: 'access_token',
    USER_ID: 'userId',
    USERNAME: 'username',
    USER_AVATAR: 'user_avatar',
    USER_EMAIL: 'user_email',
    USER_PHONE: 'user_phone',
    DISPLAY_NAME: 'displayName'
  },

  // API endpoints
  ENDPOINTS: {
    REGISTER: '/user/signin',
    LOGIN: '/token',
    USER_INFO: '/users/me'
  },

  // HTTP headers
  HEADERS: {
    CONTENT_TYPE: 'application/json',
    ACCEPT: 'application/json',
    AUTHORIZATION: 'Authorization'
  },

  // Error messages
  ERROR_MESSAGES: {
    TOKEN_INVALID: 'Token không hợp lệ',
    TOKEN_EXPIRED: 'Token đã hết hạn',
    LOGIN_FAILED: 'Đăng nhập thất bại',
    REGISTER_FAILED: 'Đăng ký thất bại',
    USER_INFO_FAILED: 'Không thể lấy thông tin người dùng'
  }
} as const; 