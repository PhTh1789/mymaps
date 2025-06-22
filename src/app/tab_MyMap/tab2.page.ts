import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, NavController, IonicModule, MenuController } from '@ionic/angular';
import { DocumentService, DocumentSummary } from '../services/document.service';
import { MapService } from '../services/map.service';
import { MapItem, CreateMapRequest } from '../services/map-api.service';
import { AuthService } from '../services/auth.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit, OnDestroy {
  searchQuery: string = '';
  segmentValue: string = 'all';
  maps: MapItem[] = [];
  filteredMaps: MapItem[] = [];
  private mapsSubscription: Subscription | undefined;

  isModalOpen = false;
  createMapForm: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private navCtrl: NavController,
    private documentService: DocumentService,
    private menu: MenuController,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private mapService: MapService,
    private loadingController: LoadingController,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    private router: Router
  ) {
    this.createMapForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      desc: [''],
      category: [''],
      share: [false]
    });
  }

  ngOnInit() {
    this.mapsSubscription = this.mapService.maps$.subscribe(maps => {
      this.maps = maps;
      this.filterMaps();
    });
    this.loadMaps();
  }

  ngOnDestroy() {
    this.mapsSubscription?.unsubscribe();
  }

  loadMaps() {
    // Sử dụng ErrorHandlerService với retry logic
    this.errorHandler.withRetry(() => 
      this.mapService.fetchUserMaps()
    ).subscribe({
      next: (maps) => {
        this.maps = maps;
        this.filterMaps();
      },
      error: (error: any) => {
        const errorMessage = this.errorHandler.handleError(error);
        this.showAlert('Lỗi', errorMessage);
      }
    });
  }

  filterMaps() {
    switch (this.segmentValue) {
      case 'created':
        this.filteredMaps = this.maps.filter(map => !map.name.startsWith('Copy of '));
        break;
      case 'shared':
        this.filteredMaps = this.maps.filter(map => map.name.startsWith('Copy of '));
        break;
      default:
        this.filteredMaps = [...this.maps];
    }
  }

  openCreateMapModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.createMapForm.reset();
    this.selectedFile = null;
    this.imagePreview = null;
  }

  // hàm lấy ảnh từ máy tính 
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Hàm chuyển đổi file thành base64
  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Loại bỏ prefix "data:image/jpeg;base64," để chỉ lấy phần base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  async onSubmit() {
    if (this.createMapForm.invalid) {
      const nameControl = this.createMapForm.get('name');
      if (nameControl?.errors?.['required']) {
        await this.showAlert('Lỗi', 'Vui lòng nhập tên bản đồ');
      } else if (nameControl?.errors?.['minlength']) {
        await this.showAlert('Lỗi', 'Tên bản đồ phải có ít nhất 2 ký tự');
      } else {
        await this.showAlert('Lỗi', 'Vui lòng kiểm tra lại thông tin');
      }
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Đang tạo bản đồ...'
    });
    await loading.present();

    try {
      let base64Image: string | null = null;
      
      // Chuyển đổi file thành base64 nếu có
      if (this.selectedFile) {
        base64Image = await this.convertFileToBase64(this.selectedFile);
      }

      // Restore full form functionality
      const mapData: CreateMapRequest = {
        name: this.createMapForm.value.name.trim(),
        desc: this.createMapForm.value.desc?.trim() || null,
        category: this.createMapForm.value.category?.trim() || null,
        share: this.createMapForm.value.share || false,
        img: base64Image || null
      };

      console.log('=== FORM DATA ===');
      console.log('Form values:', this.createMapForm.value);
      console.log('Processed mapData:', mapData);
      console.log('==================');

      this.mapService.createMap(mapData).subscribe({
        next: async (response) => {
          await loading.dismiss();
          await this.showAlert('Thành công', 'Tạo bản đồ mới thành công!');
          this.closeModal();
          this.loadMaps();
        },
        error: async (error) => {
          await loading.dismiss();
          console.error('Error creating map:', error);
          
          // Sử dụng ErrorHandlerService để xử lý lỗi
          const errorMessage = this.errorHandler.handleError(error);
          await this.showAlert('Lỗi', errorMessage);
        }
      });
    } catch (error) {
      await loading.dismiss();
      console.error('Error in onSubmit:', error);
      await this.showAlert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  segmentChanged(event: any) {
    this.segmentValue = event.detail.value;
    this.filterMaps();
  }

  onSearchChange(event: any) {
    const query = event.detail.value?.toLowerCase() || '';
    if (query.length > 0) {
      this.filteredMaps = this.maps.filter(map =>
        map.name && map.name.toLowerCase().includes(query)
      );
    } else {
      this.filteredMaps = [...this.maps];
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredMaps = [...this.maps];
  }
  
  openMenu() {
    this.menu.enable(true, 'main-menu');
    this.menu.open('main-menu');
  }
}
