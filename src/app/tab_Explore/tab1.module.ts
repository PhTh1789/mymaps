import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Tab1Page } from './tab1.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { RouterModule } from '@angular/router';
import { PointFormComponentModule } from '../components/point-form/point-form.module';
import { SharedSearchBarComponent } from '../components/shared-search-bar/shared-search-bar.component';

import { Tab1PageRoutingModule } from './tab1-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExploreContainerComponentModule,
    Tab1PageRoutingModule,
    RouterModule.forChild([{ path: '', component: Tab1Page }]),
    PointFormComponentModule,
    SharedSearchBarComponent
  ],
  declarations: [Tab1Page],
  exports: [Tab1Page]
})
export class Tab1PageModule {}
