import { Injectable } from '@angular/core';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  required?: boolean;
  uniqueNames?: string[]; // Danh sách tên đã tồn tại
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor() { }

  /**
   * Validate tên map
   */
  validateMapName(name: string, existingNames: string[] = []): ValidationResult {
    const errors: string[] = [];
    
    // Kiểm tra required
    if (!name || name.trim().length === 0) {
      errors.push('Tên bản đồ không được để trống');
      return { isValid: false, errors };
    }
    
    const trimmedName = name.trim();
    
    // Kiểm tra độ dài tối thiểu
    if (trimmedName.length < 2) {
      errors.push('Tên bản đồ phải có ít nhất 2 ký tự');
    }
    
    // Kiểm tra độ dài tối đa
    if (trimmedName.length > 100) {
      errors.push('Tên bản đồ không được vượt quá 100 ký tự');
    }
    
    // Kiểm tra ký tự đặc biệt
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      errors.push('Tên bản đồ không được chứa ký tự đặc biệt: < > : " / \\ | ? *');
    }
    
    // Kiểm tra tên trùng lặp (không phân biệt hoa thường)
    const normalizedName = trimmedName.toLowerCase();
    const isDuplicate = existingNames.some(existingName => 
      existingName.toLowerCase() === normalizedName
    );
    
    if (isDuplicate) {
      errors.push('Tên bản đồ đã tồn tại. Vui lòng chọn tên khác');
    }
    
    // Kiểm tra ký tự đầu và cuối
    if (trimmedName.startsWith('.') || trimmedName.endsWith('.')) {
      errors.push('Tên bản đồ không được bắt đầu hoặc kết thúc bằng dấu chấm');
    }
    
    // Kiểm tra khoảng trắng liên tiếp
    if (/\s{2,}/.test(trimmedName)) {
      errors.push('Tên bản đồ không được chứa khoảng trắng liên tiếp');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate tên point
   */
  validatePointName(name: string, existingNames: string[] = []): ValidationResult {
    const errors: string[] = [];
    
    // Kiểm tra required
    if (!name || name.trim().length === 0) {
      errors.push('Tên điểm không được để trống');
      return { isValid: false, errors };
    }
    
    const trimmedName = name.trim();
    
    // Kiểm tra độ dài tối thiểu
    if (trimmedName.length < 2) {
      errors.push('Tên điểm phải có ít nhất 2 ký tự');
    }
    
    // Kiểm tra độ dài tối đa
    if (trimmedName.length > 50) {
      errors.push('Tên điểm không được vượt quá 50 ký tự');
    }
    
    // Kiểm tra ký tự đặc biệt
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      errors.push('Tên điểm không được chứa ký tự đặc biệt: < > : " / \\ | ? *');
    }
    
    // Kiểm tra tên trùng lặp trong cùng một map (không phân biệt hoa thường)
    const normalizedName = trimmedName.toLowerCase();
    const isDuplicate = existingNames.some(existingName => 
      existingName.toLowerCase() === normalizedName
    );
    
    if (isDuplicate) {
      errors.push('Tên điểm đã tồn tại trong bản đồ này. Vui lòng chọn tên khác');
    }
    
    // Kiểm tra ký tự đầu và cuối
    if (trimmedName.startsWith('.') || trimmedName.endsWith('.')) {
      errors.push('Tên điểm không được bắt đầu hoặc kết thúc bằng dấu chấm');
    }
    
    // Kiểm tra khoảng trắng liên tiếp
    if (/\s{2,}/.test(trimmedName)) {
      errors.push('Tên điểm không được chứa khoảng trắng liên tiếp');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate mô tả
   */
  validateDescription(description: string): ValidationResult {
    const errors: string[] = [];
    
    if (description && description.trim().length > 0) {
      const trimmedDesc = description.trim();
      
      // Kiểm tra độ dài tối đa
      if (trimmedDesc.length > 500) {
        errors.push('Mô tả không được vượt quá 500 ký tự');
      }
      
      // Kiểm tra ký tự đặc biệt nguy hiểm
      const dangerousChars = /[<>]/;
      if (dangerousChars.test(trimmedDesc)) {
        errors.push('Mô tả không được chứa ký tự < >');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate tọa độ địa lý
   */
  validateGeom(geom: string): ValidationResult {
    const errors: string[] = [];
    
    if (!geom || geom.trim().length === 0) {
      errors.push('Tọa độ địa lý không được để trống');
      return { isValid: false, errors };
    }
    
    const trimmedGeom = geom.trim();
    
    // Kiểm tra format cơ bản (lon lat)
    const geomPattern = /^-?\d+(\.\d+)?\s+-?\d+(\.\d+)?$/;
    if (!geomPattern.test(trimmedGeom)) {
      errors.push('Tọa độ địa lý không đúng định dạng (kinh độ vĩ độ)');
      return { isValid: false, errors };
    }
    
    // Tách và kiểm tra từng tọa độ
    const coords = trimmedGeom.split(/\s+/);
    if (coords.length !== 2) {
      errors.push('Tọa độ địa lý phải có đúng 2 giá trị (kinh độ và vĩ độ)');
      return { isValid: false, errors };
    }
    
    const lon = parseFloat(coords[0]);
    const lat = parseFloat(coords[1]);
    
    // Kiểm tra phạm vi kinh độ (-180 đến 180)
    if (lon < -180 || lon > 180) {
      errors.push('Kinh độ phải nằm trong khoảng -180 đến 180');
    }
    
    // Kiểm tra phạm vi vĩ độ (-90 đến 90)
    if (lat < -90 || lat > 90) {
      errors.push('Vĩ độ phải nằm trong khoảng -90 đến 90');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate ảnh (base64)
   */
  validateImage(imageBase64: string): ValidationResult {
    const errors: string[] = [];
    
    if (imageBase64 && imageBase64.trim().length > 0) {
      const trimmedImage = imageBase64.trim();
      
      // Kiểm tra format base64
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Pattern.test(trimmedImage)) {
        errors.push('Ảnh không đúng định dạng base64');
      }
      
      // Kiểm tra kích thước (giới hạn 5MB)
      const sizeInBytes = Math.ceil((trimmedImage.length * 3) / 4);
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      if (sizeInMB > 5) {
        errors.push('Kích thước ảnh không được vượt quá 5MB');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize input string
   */
  sanitizeString(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/\s+/g, ' ') // Thay thế khoảng trắng liên tiếp bằng 1 khoảng trắng
      .replace(/[<>:"/\\|?*]/g, ''); // Loại bỏ ký tự đặc biệt
  }

  /**
   * Format error message cho hiển thị
   */
  formatErrorMessage(errors: string[]): string {
    if (errors.length === 0) return '';
    
    if (errors.length === 1) {
      return errors[0];
    }
    
    return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
  }
} 