import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';  
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class RegisterPage {
  user_name: string = '';
  user_pass: string = '';
  email: string = '';
  password2: string = '';
  submitted = false;
  registerError: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  // Toggle hiển thị/ẩn mật khẩu
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Toggle hiển thị/ẩn mật khẩu xác nhận
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Nút đăng ký
  onSubmit() {
    this.submitted = true;
    this.registerError = '';

    if (!this.user_name || !this.email || !this.user_pass || !this.password2) {
      this.registerError = 'Vui lòng điền đầy đủ thông tin.';
      alert(this.registerError);
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.registerError = 'Email không hợp lệ.';
      alert(this.registerError);
      return;
    }

    if (this.user_pass.length < 8) {
      this.registerError = 'Mật khẩu phải từ 8 ký tự trở lên.';
      alert(this.registerError);
      return;
    }

    if (this.user_pass !== this.password2) {
      this.registerError = 'Mật khẩu nhập lại không khớp.';
      alert(this.registerError);
      return;
    }

    const payload = {
      user_name: this.user_name,
      user_pass: this.user_pass,
      email: this.email
    };

    //Lấy hành động từ authService
    this.authService.register(payload).subscribe({
      next: (res) => {
        alert('Đăng ký tài khoản thành công!');
        localStorage.setItem('user_email', this.email)
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 400) {
          this.registerError = err.error?.message || 'Tài khoản đã tồn tại hoặc dữ liệu không hợp lệ.';
        } else {
          this.registerError = 'Lỗi máy chủ hoặc kết nối. Vui lòng thử lại.';
        }
        alert(this.registerError);
      }
    });
  }

  isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  }
}
