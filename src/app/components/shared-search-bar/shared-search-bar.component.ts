import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { IonicModule, MenuController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shared-search-bar',
  templateUrl: './shared-search-bar.component.html',
  styleUrls: ['./shared-search-bar.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SharedSearchBarComponent implements OnInit {
  @Input() placeholder: string = 'Tìm kiếm...';
  @Input() showAvatar: boolean = true;
  @Input() searchQuery: string = '';
  @Input() showSuggestions: boolean = false;
  @Input() suggestions: any[] = [];
  
  @Output() searchChange = new EventEmitter<string>();
  @Output() searchClear = new EventEmitter<void>();
  @Output() suggestionSelect = new EventEmitter<any>();
  @Output() menuOpen = new EventEmitter<void>();

  constructor(private menu: MenuController) {}

  ngOnInit() {}

  onSearchChange(event: any) {
    const query = event.detail.value || '';
    this.searchChange.emit(query);
  }

  onSearchClear() {
    this.searchClear.emit();
  }

  onSuggestionSelect(item: any) {
    this.suggestionSelect.emit(item);
  }

  openMenu() {
    this.menu.enable(true, 'main-menu');
    this.menu.open('main-menu');
    this.menuOpen.emit();
  }

  getSuggestionIcon(item: any): string {
    // Nếu có display_name (từ OpenStreetMap), sử dụng location icon
    if (item.display_name) {
      return 'location-outline';
    }
    // Nếu có author (template/map), sử dụng map icon
    if (item.author) {
      return 'map-outline';
    }
    // Mặc định
    return 'map-outline';
  }
} 