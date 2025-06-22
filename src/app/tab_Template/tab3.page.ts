import { Component, OnInit } from '@angular/core';
import { NavController, IonicModule, MenuController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { MapService } from '../services/map.service';
import { TemplateItem } from '../services/map-api.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {
  files: TemplateItem[] = [];
  filteredFiles: TemplateItem[] = [];
  searchQuery: string = '';
  showSuggestions: boolean = false;
  
  constructor(
    private navCtrl: NavController,
    private menu: MenuController,
    private authService: AuthService,
    private mapService: MapService
  ) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    // Sử dụng API /template/ để lấy danh sách template
    this.mapService.getTemplates().subscribe({
      next: (data) => {
        this.files = data;
        this.filteredFiles = this.files;
        console.log('Template data from API:', this.files);
      },
      error: (error) => {
        console.error('Error loading templates:', error);
      }
    });
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value.toLowerCase();
    this.showSuggestions = this.searchQuery.length > 0;
    
    // Lọc kết quả tìm kiếm bằng tên của template hoặc tên tác giả
    this.filteredFiles = this.files.filter(file =>
      file.name.toLowerCase().includes(this.searchQuery) ||
      file.author.toLowerCase().includes(this.searchQuery)
    );
  }

  selectSuggestion(file: TemplateItem) {
    this.searchQuery = file.name;
    this.showSuggestions = false;
    this.filteredFiles = [file];
  }

  clearSearch() {
    this.searchQuery = '';
    this.showSuggestions = false;
    this.filteredFiles = this.files;
  }
  
  openMenu() {
    this.menu.enable(true, 'main-menu');
    this.menu.open('main-menu');
  }
}
