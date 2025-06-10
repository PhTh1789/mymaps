import { Component } from '@angular/core';
import { TabLabels } from '../tab-labels'; // đường dẫn có thể là './tab-labels' nếu ở cùng thư mục

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})

export class Tab2Page {
  tab1 = TabLabels.tab1;
  tab2 = TabLabels.tab2;
  tab3 = TabLabels.tab3;

  constructor() {}
}
