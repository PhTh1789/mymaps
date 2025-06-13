import { Component, Input } from '@angular/core';
import { IonicModule, MenuController } from '@ionic/angular'; // Đảm bảo import IonicModule

@Component({
  selector: 'app-base-layout',
  standalone: true,
  templateUrl: './base-layout.component.html',
  styleUrls: ['./base-layout.component.scss'],
  imports: [IonicModule]
})
export class BaseLayoutComponent {
  @Input() title: string = '';
  
  constructor(
    private menu: MenuController,
  ) {};

  openMenu() {
    this.menu.enable(true, 'main-menu'); 
    this.menu.open('main-menu');        
  }
}