import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PointFormComponent } from './point-form.component';

@NgModule({
  declarations: [PointFormComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
  exports: [PointFormComponent]
})
export class PointFormComponentModule {} 