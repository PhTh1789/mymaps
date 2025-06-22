import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

export interface UserInfo {
  userId: string | null;
  username: string | null;
  avatar: string | null;
  email?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private userInfoSubject = new BehaviorSubject<UserInfo>({
    userId: null,
    username: null,
    avatar: null
  });

  private loggedInSubject = new BehaviorSubject<boolean>(false);

  userInfo$ = this.userInfoSubject.asObservable();
  isLoggedIn$ = this.loggedInSubject.asObservable();

  constructor() {
    this.initializeFromStorage();
  }

  private initializeFromStorage(): void {
    const savedLogin = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.LOGGED_IN) === 'true';
    this.loggedInSubject.next(savedLogin);

    if (savedLogin) {
      const userInfo: UserInfo = {
        userId: localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_ID),
        username: localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.USERNAME),
        avatar: localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_AVATAR),
        email: localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_EMAIL) || undefined,
        phone: localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_PHONE) || undefined
      };
      this.userInfoSubject.next(userInfo);
    }
  }

  setUserInfo(userInfo: Partial<UserInfo>): void {
    const currentInfo = this.userInfoSubject.value;
    const newInfo = { ...currentInfo, ...userInfo };
    
    this.userInfoSubject.next(newInfo);
    
    // Lưu vào localStorage
    if (userInfo.userId) localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_ID, userInfo.userId);
    if (userInfo.username) localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USERNAME, userInfo.username);
    if (userInfo.avatar !== undefined) {
      if (userInfo.avatar) {
        localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_AVATAR, userInfo.avatar);
      } else {
        localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_AVATAR);
      }
    }
    if (userInfo.email) localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_EMAIL, userInfo.email);
    if (userInfo.phone) localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_PHONE, userInfo.phone);
  }

  setLoggedIn(status: boolean): void {
    this.loggedInSubject.next(status);
    localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.LOGGED_IN, status.toString());
  }

  clearUserData(): void {
    const keys = Object.values(AUTH_CONSTANTS.STORAGE_KEYS);
    keys.forEach(key => localStorage.removeItem(key));
    
    this.userInfoSubject.next({ userId: null, username: null, avatar: null });
    this.loggedInSubject.next(false);
  }

  getCurrentUserInfo(): UserInfo {
    return this.userInfoSubject.value;
  }

  isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }
} 