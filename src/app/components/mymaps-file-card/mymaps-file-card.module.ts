import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MymapsFileCardComponent } from './mymaps-file-card.component';

@NgModule({
  declarations: [
    MymapsFileCardComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    MymapsFileCardComponent
  ]
})
export class MymapsFileCardModule { }