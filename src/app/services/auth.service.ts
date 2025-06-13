import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://mymaps-app.onrender.com/';
  private tokenKey = 'auth_token';
  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());

  private loggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedIn.asObservable();

  private username = new BehaviorSubject<string | null>(null);
  username$ = this.username.asObservable();

  private userId = new BehaviorSubject<string | null>(null);
  userId$ = this.userId.asObservable();


  constructor(private http: HttpClient) {
    const savedLogin = localStorage.getItem('loggedIn') === 'true';
    this.loggedIn.next(savedLogin);

    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      this.username.next(savedUsername);
    }

    // Khởi tạo token từ localStorage khi service được tạo
    const savedToken = localStorage.getItem(this.tokenKey);
    if (savedToken) {
      this.tokenSubject.next(savedToken);
    }
  }

  getIsLoggedIn(): boolean {
    return this.loggedIn.value;
  }

  getUsername(): string | null {
    return this.username.value;
  }
  getUserId(): string | null {
    return this.userId.value;
  }

  register(data: { username: string; email: string; password: string }): Observable<any> {
    const body = new URLSearchParams();
    body.set('user_name', data.username);
    body.set('user_password', data.password);
    body.set('user_email', data.email);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    });

    return this.http.post(`${this.apiUrl}user/signin`, body.toString(), { headers });
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', credentials.username);
    body.set('password', credentials.password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    });

    return this.http.post(`${this.apiUrl}token`, body.toString(), { headers }).pipe(
      tap((response: any) => {
        if (response && response.access_token) {
          localStorage.setItem('loggedIn', 'true');
          localStorage.setItem('username', credentials.username);
          localStorage.setItem('access_token', response.access_token);

          this.loggedIn.next(true);
          this.username.next(credentials.username);
          this.userId.next(response.user_id);
          this.setToken(response.access_token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('access_token');

    this.loggedIn.next(false);
    this.username.next(null);
    this.removeToken();
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  setLoginStatus(status: boolean): void {
    this.loggedIn.next(status);
    localStorage.setItem('loggedIn', status.toString());
  }

  setUsername(username: string | null): void {
    this.username.next(username);
    if (username) {
      localStorage.setItem('username', username);
    } else {
      localStorage.removeItem('username');
    }
  }

  // Lấy token hiện tại
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Lưu token mới
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.tokenSubject.next(token);
  }

  // Xóa token
  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.tokenSubject.next(null);
  }

  // Observable để theo dõi thay đổi của token
  getTokenObservable(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  // Kiểm tra xem người dùng đã đăng nhập chưa
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
