import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tab2Page } from './tab2.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { HttpClientModule } from '@angular/common/http';
import { SharedSearchBarComponent } from '../components/shared-search-bar/shared-search-bar.component';

import { Tab2PageRoutingModule } from './tab2-routing.module';
import { MymapsFileCardModule } from '../components/mymaps-file-card/mymaps-file-card.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExploreContainerComponentModule,
    Tab2PageRoutingModule,
    HttpClientModule,
    MymapsFileCardModule,
    SharedSearchBarComponent
  ],
  declarations: [Tab2Page]
})
export class Tab2PageModule {}
