import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// Tự động thêm token vào header Authorization của mọi request nếu token tồn tại trong storage

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  /**
   * Phương thức intercept được gọi trước mỗi HTTP request
   * @param request - Request gốc
   * @param next - Handler để tiếp tục xử lý request
   * @returns Observable<HttpEvent<any>> - Observable chứa response
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Chuyển đổi Promise từ getToken() thành Observable
    return from(this.authService.getToken()).pipe(
      // Sử dụng mergeMap để xử lý token và tạo request mới
      mergeMap(token => {
        if (token) {
          // Nếu có token, clone request và thêm header Authorization
          const cloned = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next.handle(cloned);
        }
        // Nếu không có token, tiếp tục với request gốc
        return next.handle(request);
      })
    );
  }
}