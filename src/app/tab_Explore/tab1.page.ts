import { Component } from '@angular/core';
import { TabLabels } from '../tab-labels'; // đường dẫn có thể là './tab-labels' nếu ở cùng thư mục

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
  
})
export class Tab1Page {
  tab1 = TabLabels.tab1;
  tab2 = TabLabels.tab2;
  tab3 = TabLabels.tab3;
  constructor() {}

}
