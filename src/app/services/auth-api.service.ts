import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  user_name: string;
  user_pass: string;
  email: string;
}

export interface UserResponse {
  user_id: string;
  username: string;
  user_email?: string;
  user_phone?: string;
  avatar?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private apiUrl = 'https://myapp-r4xt.onrender.com';

  constructor(private http: HttpClient) {}

  private createJsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  private createAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  register(data: RegisterData): Observable<any> {
    const registerData = {
      user_name: data.user_name,
      user_pass: data.user_pass,
      email: data.email
    };

    return this.http.post(`${this.apiUrl}/user/signin`, registerData, { 
      headers: this.createJsonHeaders() 
    });
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    const body = new URLSearchParams();
    body.set('username', credentials.username);
    body.set('password', credentials.password);

    const formHeaders = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    });

    return this.http.post<LoginResponse>(`${this.apiUrl}/token`, body.toString(), { 
      headers: formHeaders
    });
  }

  getUserInfo(token: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/users/me`, { 
      headers: this.createAuthHeaders(token) 
    });
  }

  getApiUrl(): string {
    return this.apiUrl;
  }
} 