import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule,
  ],
})
export class LoginPage {
  username: string = '';
  password: string = '';
  loginError: string = '';
  submitted = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onSubmit() {
    this.submitted = true;
    this.loginError = '';

    if (!this.username || !this.password) {
      this.loginError = 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.';
      return;
    }

    const loginData = {
      username: this.username,
      password: this.password
    };

    this.authService.login(loginData).subscribe({
      next: (res: any) => {
        // ✅ Kiểm tra token
        if (res.access_token) {
          alert('Đăng nhập thành công!');

          // ✅ Lưu trạng thái login
          this.authService.setLoginStatus(true);
          this.authService.setUsername(this.username);

          // ✅ Điều hướng
          this.router.navigate(['/tabs']);
        } else {
          this.loginError = 'Đăng nhập không thành công.';
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Login failed:', error);
        this.loginError = error.error?.detail || 'Tài khoản hoặc mật khẩu không đúng!';
        alert(this.loginError);
      }
    });
  }
}
