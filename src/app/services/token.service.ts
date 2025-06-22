import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private tokenExpiredSubject = new BehaviorSubject<boolean>(false);
  tokenExpired$ = this.tokenExpiredSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAccessToken(): string | null {
    return localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.ACCESS_TOKEN);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  removeAccessToken(): void {
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.ACCESS_TOKEN);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': AUTH_CONSTANTS.HEADERS.ACCEPT
    });
  }

  isTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        this.handleTokenExpiration();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Lỗi khi kiểm tra token:', error);
      this.handleTokenExpiration();
      return false;
    }
  }

  handleTokenExpiration(): void {
    console.log(AUTH_CONSTANTS.ERROR_MESSAGES.TOKEN_EXPIRED);
    this.tokenExpiredSubject.next(true);
  }

  resetTokenExpiredStatus(): void {
    this.tokenExpiredSubject.next(false);
  }

  checkTokenValidity(apiUrl: string): Observable<boolean> {
    if (!this.isTokenValid()) {
      return throwError(() => new Error(AUTH_CONSTANTS.ERROR_MESSAGES.TOKEN_INVALID));
    }

    return this.http.get<any>(`${apiUrl}${AUTH_CONSTANTS.ENDPOINTS.USER_INFO}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => {
        this.resetTokenExpiredStatus();
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.handleTokenExpiration();
        }
        return throwError(() => error);
      })
    );
  }

  decodeToken(): any {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Lỗi khi decode token:', error);
      return null;
    }
  }
} 