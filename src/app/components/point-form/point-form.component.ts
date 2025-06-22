import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidationService } from '../../services/validation.service';

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
  validationErrors: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private validationService: ValidationService
  ) {
    this.pointForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(500)]],
      image: [null],
      geom: [{ value: '', disabled: true }, Validators.required]
    });

    // Real-time validation
    this.pointForm.get('name')?.valueChanges.subscribe(value => {
      this.validateField('name', value);
    });

    this.pointForm.get('description')?.valueChanges.subscribe(value => {
      this.validateField('description', value);
    });
  }

  ngOnChanges() {
    this.pointForm.patchValue({ geom: this.geom || '' });
  }

  private validateField(fieldName: string, value: string) {
    let validation: any;
    
    switch (fieldName) {
      case 'name':
        validation = this.validationService.validatePointName(value);
        break;
      case 'description':
        validation = this.validationService.validateDescription(value);
        break;
      default:
        return;
    }

    if (!validation.isValid) {
      this.validationErrors[fieldName] = validation.errors;
    } else {
      delete this.validationErrors[fieldName];
    }
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) { // 5MB
        this.validationErrors['image'] = ['Kích thước ảnh không được vượt quá 5MB'];
        event.target.value = '';
        this.selectedImage = null;
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.validationErrors['image'] = ['Chỉ chấp nhận file ảnh: JPEG, JPG, PNG, GIF'];
        event.target.value = '';
        this.selectedImage = null;
        return;
      }

      this.selectedImage = file;
      delete this.validationErrors['image'];
    }
  }

  onSubmit() {
    if (this.pointForm.valid && this.hasNoValidationErrors()) {
      const { name, description } = this.pointForm.value;
      this.submitPoint.emit({
        name,
        description: description || undefined,
        image: this.selectedImage || undefined,
        geom: this.geom || ''
      });
    } else {
      this.pointForm.markAllAsTouched();
      this.validateAllFields();
    }
  }

  private validateAllFields() {
    const name = this.pointForm.get('name')?.value;
    const description = this.pointForm.get('description')?.value;

    if (name) this.validateField('name', name);
    if (description) this.validateField('description', description);
  }

  // Helper method để kiểm tra field có lỗi không
  hasFieldError(fieldName: string): boolean {
    const control = this.pointForm.get(fieldName);
    return !!(control?.errors && control.touched) || !!(this.validationErrors[fieldName] && this.validationErrors[fieldName].length > 0);
  }

  // Method để kiểm tra có validation errors không (public để template có thể sử dụng)
  hasNoValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length === 0;
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
      if (nameControl.errors['maxlength']) {
        return 'Tên điểm không được vượt quá 50 ký tự';
      }
    }
    
    // Kiểm tra validation errors từ service
    if (this.validationErrors['name'] && this.validationErrors['name'].length > 0) {
      return this.validationErrors['name'][0];
    }
    
    return '';
  }

  get descriptionError(): string {
    const descControl = this.pointForm.get('description');
    if (descControl?.errors && descControl.touched) {
      if (descControl.errors['maxlength']) {
        return 'Mô tả không được vượt quá 500 ký tự';
      }
    }
    
    // Kiểm tra validation errors từ service
    if (this.validationErrors['description'] && this.validationErrors['description'].length > 0) {
      return this.validationErrors['description'][0];
    }
    
    return '';
  }

  get imageError(): string {
    if (this.validationErrors['image'] && this.validationErrors['image'].length > 0) {
      return this.validationErrors['image'][0];
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