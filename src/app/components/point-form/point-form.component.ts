import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-point-form',
  templateUrl: './point-form.component.html',
  styleUrls: ['./point-form.component.scss'],
  standalone: false
})
export class PointFormComponent {
  @Input() geom: string | null = '';
  @Input() loading: boolean = false;
  @Output() submitPoint = new EventEmitter<any>();

  pointForm: FormGroup;
  selectedImage: File | null = null;

  constructor(private fb: FormBuilder) {
    this.pointForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      image: [null],
      geom: [{ value: '', disabled: true }, Validators.required]
    });
  }

  ngOnChanges() {
    this.pointForm.patchValue({ geom: this.geom || '' });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
    }
  }

  onSubmit() {
    if (this.pointForm.valid) {
      const { name, description } = this.pointForm.value;
      this.submitPoint.emit({
        name,
        description,
        image: this.selectedImage,
        geom: this.geom || ''
      });
    } else {
      this.pointForm.markAllAsTouched();
    }
  }
} 