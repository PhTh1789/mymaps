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

//Không dùng implement OnInit vì tài khoản chỉ đăng nhập rồi xài
export class LoginPage {

  // Khai báo kiểu dữ liệu
  username: string = '';
  password: string = '';
  loginError: string = '';
  submitted = false;

  //Thực hiện lệnh khi được khởi tạo
  constructor(
    private router: Router, // Thực hiện lệnh ở class mà gọi import
    private authService: AuthService
  ) {}


  //Nút nhấn đăng nhập
  onSubmit() {
    this.submitted = true;
    this.loginError = '';

    // Nếu thiếu 2 in 1 thì thông báo lỗi
    if (!this.username || !this.password) {
      this.loginError = 'Vui lòng điền đầy đủ tài khoản mật khẩu';
      return;
    }

    const loginData = {
      username: this.username,
      password: this.password
    };

    this.authService.login(loginData).subscribe({
      next: (res: any) => {
        // Kiểm tra token
        if (res.access_token) {
          // Lưu trạng thái login
          this.authService.setLoginStatus(true);
          this.authService.setUsername(this.username);

          // Điều hướng
          this.router.navigate(['/tabs']);
        } else {
          this.loginError = 'Đăng nhập thất bại';
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Đăng nhập thất bại:', error);
        this.loginError = error.error?.detail || 'Tài khoản hoặc mật khẩu không đúng';
        alert(this.loginError);
      }
    });
  }
}
