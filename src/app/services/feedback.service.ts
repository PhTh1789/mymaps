import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface FeedbackRequest {
  id: number;
  star: number;
  desc: string;
}

export interface FeedbackResponse {
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = 'https://mymaps-app.onrender.com';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  submitFeedback(feedbackData: FeedbackRequest): Observable<FeedbackResponse> {
    const headers = this.getAuthHeaders();
    
    return this.http.post<FeedbackResponse>(`${this.apiUrl}/feedback/`, feedbackData, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error submitting feedback:', error);
        return throwError(() => error);
      })
    );
  }

  validateFeedback(feedbackData: FeedbackRequest): { isValid: boolean; message: string } {
    if (feedbackData.star < 1 || feedbackData.star > 5) {
      return { isValid: false, message: 'Vui lòng chọn số sao từ 1 đến 5.' };
    }

    if (!feedbackData.desc || feedbackData.desc.trim().length === 0) {
      return { isValid: false, message: 'Vui lòng nhập nội dung phản hồi.' };
    }

    if (feedbackData.desc.trim().length < 10) {
      return { isValid: false, message: 'Nội dung phản hồi phải có ít nhất 10 ký tự.' };
    }

    return { isValid: true, message: '' };
  }
} 