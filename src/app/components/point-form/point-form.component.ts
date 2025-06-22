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
      name: ['', [Validators.required, Validators.minLength(2)]],
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
        description: description || undefined,
        image: this.selectedImage || undefined,
        geom: this.geom || ''
      });
    } else {
      this.pointForm.markAllAsTouched();
    }
  }

  // Getter để kiểm tra lỗi validation
  get nameError(): string {
    const nameControl = this.pointForm.get('name');
    if (nameControl?.errors && nameControl.touched) {
      if (nameControl.errors['required']) {
        return 'Tên điểm là bắt buộc';
      }
      if (nameControl.errors['minlength']) {
        return 'Tên điểm phải có ít nhất 2 ký tự';
      }
    }
    return '';
  }

  get geomError(): string {
    const geomControl = this.pointForm.get('geom');
    if (geomControl?.errors && geomControl.touched) {
      if (geomControl.errors['required']) {
        return 'Tọa độ là bắt buộc';
      }
    }
    return '';
  }
} 