import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { MAP_CONSTANTS } from '../constants/map.constants';
import { ValidationService } from './validation.service';

// Interfaces
export interface MapItem {
  id: number;
  name: string;
  author: string;
  author_id: number;
  cre_at: string;
  upd_at: string;
  share: boolean;
  // Các trường tùy chọn có thể có
  desc?: string;
  img?: string;
  category?: string;
  modified_at?: string;
  user_id?: string;
  user_name?: string;
  map_id?: number; // Để tương thích với code cũ
}

// Interface cho response từ /template/
export interface TemplateResponse {
  id: number;
  map_id: number;
  no_like: number;
  liked: boolean;
  maps: {
    id: number;
    name: string;
    author: string;
    author_id: number;
    cre_at: string;
    upd_at: string;
    share: boolean;
  };
}

// Interface cho template item đã được transform
export interface TemplateItem {
  id: number;
  map_id: number;
  no_like: number;
  liked: boolean;
  name: string;
  author: string;
  author_id: number;
  cre_at: string;
  upd_at: string;
  share: boolean;
}

export interface CreateMapRequest {
  name: string;
  desc?: string | null;
  img?: string | null;
  category?: string | null;
  share?: boolean | null;
}

export interface CreatePointRequest {
  map_id: number;
  name: string;
  desc?: string | null;
  img?: string | null;
  geom: string;
}

@Injectable({
  providedIn: 'root'
})
export class MapApiService {
  private apiUrl = MAP_CONSTANTS.API_URL;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private validationService: ValidationService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  getMaps(): Observable<MapItem[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<MapItem[]>(`${this.apiUrl}${MAP_CONSTANTS.ENDPOINTS.MAPS}`, { headers });
  }

  // Method để lấy thông tin map theo ID
  getMapById(mapId: string): Observable<MapItem> {
    const headers = this.getAuthHeaders();
    const mapIdInt = parseInt(mapId);
    if (isNaN(mapIdInt)) {
      return throwError(() => new Error('Map ID không hợp lệ. Phải là số nguyên.'));
    }
    const url = `${this.apiUrl}/map/?map_id=${mapIdInt}`;
    return this.http.get<MapItem>(url, { headers });
  }

  createMap(mapData: CreateMapRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getAccessToken()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    // Validate tên map trước khi gửi request
    const nameValidation = this.validationService.validateMapName(mapData.name);
    if (!nameValidation.isValid) {
      const errorMessage = this.validationService.formatErrorMessage(nameValidation.errors);
      return throwError(() => new Error(errorMessage));
    }
    
    // Sanitize dữ liệu
    const sanitizedName = this.validationService.sanitizeString(mapData.name);
    
    // Chỉ gửi name bắt buộc và các trường khác nếu có giá trị
    const jsonData: any = {
      name: sanitizedName
    };
    
    // Chỉ thêm các trường có giá trị và không rỗng
    if (mapData.desc !== undefined && mapData.desc !== null && mapData.desc.trim() !== '') {
      const descValidation = this.validationService.validateDescription(mapData.desc);
      if (!descValidation.isValid) {
        const errorMessage = this.validationService.formatErrorMessage(descValidation.errors);
        return throwError(() => new Error(errorMessage));
      }
      jsonData.desc = this.validationService.sanitizeString(mapData.desc);
    }
    
    if (mapData.img !== undefined && mapData.img !== null && mapData.img.trim() !== '') {
      jsonData.img = mapData.img.trim();
    }
    
    if (mapData.category !== undefined && mapData.category !== null && mapData.category.trim() !== '') {
      jsonData.category = this.validationService.sanitizeString(mapData.category);
    }
    
    if (mapData.share !== undefined && mapData.share !== null) {
      jsonData.share = mapData.share;
    }
    
    console.log('📤 Gửi request tạo map:', jsonData);
    
    return this.http.post(`${this.apiUrl}${MAP_CONSTANTS.ENDPOINTS.MAPS}`, jsonData, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Lỗi tạo map:', error.status, error.message);
        
        // Xử lý các loại lỗi cụ thể
        if (error.status === 0) {
          return throwError(() => new Error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.'));
        } else if (error.status === 400) {
          let errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
          if (error.error?.detail) {
            errorMessage = error.error.detail;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          return throwError(() => new Error(errorMessage));
        } else if (error.status === 422) {
          let errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
          if (error.error?.detail) {
            errorMessage = error.error.detail;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          return throwError(() => new Error(errorMessage));
        } else if (error.status === 500) {
          return throwError(() => new Error('Lỗi server. Vui lòng thử lại sau.'));
        }
        
        return throwError(() => new Error('Không thể tạo bản đồ. Vui lòng thử lại sau.'));
      })
    );
  }

  updateMap(mapId: string, mapData: Partial<CreateMapRequest>): Observable<any> {
    const headers = this.getAuthHeaders();
    const mapIdInt = parseInt(mapId);
    if (isNaN(mapIdInt)) {
      return throwError(() => new Error('Map ID không hợp lệ. Phải là số nguyên.'));
    }
    const url = `${this.apiUrl}${MAP_CONSTANTS.ENDPOINTS.MAPS}/${mapIdInt}`;
    return this.http.put(url, mapData, { headers });
  }

  deleteMap(mapId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const mapIdInt = parseInt(mapId);
    if (isNaN(mapIdInt)) {
      return throwError(() => new Error('Map ID không hợp lệ. Phải là số nguyên.'));
    }
    const url = `${this.apiUrl}/map/?map_id=${mapIdInt}`;
    
    return this.http.delete(url, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Lỗi xóa map:', error.status, error.message);
        return throwError(() => error);
      })
    );
  }

  toPublicMap(mapId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getAccessToken()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    // Đảm bảo map_id là integer
    const mapIdInt = parseInt(mapId);
    if (isNaN(mapIdInt)) {
      return throwError(() => new Error('Map ID không hợp lệ. Phải là số nguyên.'));
    }
    
    // Sử dụng endpoint /template/ thay vì /template/?map_id
    const url = `${this.apiUrl}/template/`;
    
    // Gửi map_id trong body
    const payload = { map_id: mapIdInt };
    
    return this.http.post(url, payload, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Lỗi public map:', error.status, error.message);
        
        // Xử lý các loại lỗi cụ thể
        if (error.status === 400) {
          return throwError(() => new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'));
        } else if (error.status === 404) {
          return throwError(() => new Error('Không tìm thấy bản đồ cần public.'));
        } else if (error.status === 422) {
          return throwError(() => new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'));
        } else if (error.status === 500) {
          return throwError(() => new Error('Lỗi server. Vui lòng thử lại sau.'));
        }
        
        return throwError(() => new Error('Không thể public bản đồ. Vui lòng thử lại sau.'));
      })
    );
  }

  toPrivateMap(mapId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const mapIdInt = parseInt(mapId);
    if (isNaN(mapIdInt)) {
      return throwError(() => new Error('Map ID không hợp lệ. Phải là số nguyên.'));
    }
    const url = `${this.apiUrl}/map/?map_id=${mapIdInt}`;

    return this.http.put(url, { share: false }, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Lỗi chuyển map về private:', error.status, error.message);
        return throwError(() => error);
      })
    );
  }

  getTemplates(): Observable<TemplateItem[]> {
    return this.http.get<TemplateResponse[]>(`${this.apiUrl}/template/`, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Lỗi lấy templates:', error.status, error.message);
        
        if (error.status === 0) {
          return throwError(() => new Error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.'));
        } else if (error.status === 401 || error.status === 403) {
          return throwError(() => new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
        } else if (error.status === 500) {
          return throwError(() => new Error('Lỗi server. Vui lòng thử lại sau.'));
        }
        
        return throwError(() => new Error('Không thể lấy danh sách template. Vui lòng thử lại sau.'));
      }),
      // Transform response để flatten structure
      map((response: TemplateResponse[]) => {
        return response.map(item => ({
          id: item.id,
          map_id: item.map_id,
          no_like: item.no_like,
          liked: item.liked,
          name: item.maps.name,
          author: item.maps.author,
          author_id: item.maps.author_id,
          cre_at: item.maps.cre_at,
          upd_at: item.maps.upd_at,
          share: item.maps.share
        }));
      })
    );
  }

  // hàm tạo điểm với endpoint mới
  createPoint(pointData: CreatePointRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getAccessToken()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    // Validate map_id
    const mapIdInt = parseInt(pointData.map_id.toString());
    if (isNaN(mapIdInt)) {
      return throwError(() => new Error('Map ID không hợp lệ. Phải là số nguyên.'));
    }
    
    // Validate tên point
    const nameValidation = this.validationService.validatePointName(pointData.name);
    if (!nameValidation.isValid) {
      const errorMessage = this.validationService.formatErrorMessage(nameValidation.errors);
      return throwError(() => new Error(errorMessage));
    }
    
    // Validate geom
    const geomValidation = this.validationService.validateGeom(pointData.geom);
    if (!geomValidation.isValid) {
      const errorMessage = this.validationService.formatErrorMessage(geomValidation.errors);
      return throwError(() => new Error(errorMessage));
    }
    
    // Validate description nếu có
    if (pointData.desc !== undefined && pointData.desc !== null && pointData.desc.trim() !== '') {
      const descValidation = this.validationService.validateDescription(pointData.desc);
      if (!descValidation.isValid) {
        const errorMessage = this.validationService.formatErrorMessage(descValidation.errors);
        return throwError(() => new Error(errorMessage));
      }
    }
    
    // Validate image nếu có
    if (pointData.img !== undefined && pointData.img !== null && pointData.img.trim() !== '') {
      const imageValidation = this.validationService.validateImage(pointData.img);
      if (!imageValidation.isValid) {
        const errorMessage = this.validationService.formatErrorMessage(imageValidation.errors);
        return throwError(() => new Error(errorMessage));
      }
    }
    
    // Sanitize dữ liệu
    const sanitizedName = this.validationService.sanitizeString(pointData.name);
    const sanitizedDesc = pointData.desc ? this.validationService.sanitizeString(pointData.desc) : null;
    const sanitizedGeom = this.validationService.sanitizeString(pointData.geom);
    
    // Tạo payload JSON
    const payload: any = {
      map_id: mapIdInt,
      name: sanitizedName,
      geom: sanitizedGeom
    };
    
    // Chỉ thêm desc nếu có giá trị
    if (sanitizedDesc) {
      payload.desc = sanitizedDesc;
    }
    
    // Chỉ thêm img nếu có giá trị (base64 string)
    if (pointData.img !== undefined && pointData.img !== null && pointData.img.trim() !== '') {
      payload.img = pointData.img.trim();
    }
    
    console.log('📤 Gửi request tạo điểm:', {
      map_id: payload.map_id,
      name: payload.name,
      desc: payload.desc ? 'Có mô tả' : 'Không có mô tả',
      img: payload.img ? 'Có ảnh (base64)' : 'Không có ảnh',
      geom: payload.geom
    });
    
    return this.http.post(`${this.apiUrl}/point/`, payload, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Lỗi tạo điểm:', error.status, error.message);
        
        // Xử lý các loại lỗi cụ thể
        if (error.status === 0) {
          return throwError(() => new Error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.'));
        } else if (error.status === 400) {
          let errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
          if (error.error?.detail) {
            errorMessage = error.error.detail;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          return throwError(() => new Error(errorMessage));
        } else if (error.status === 401) {
          return throwError(() => new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
        } else if (error.status === 403) {
          return throwError(() => new Error('Không có quyền tạo điểm trên bản đồ này.'));
        } else if (error.status === 404) {
          return throwError(() => new Error('Không tìm thấy bản đồ.'));
        } else if (error.status === 422) {
          let errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
          if (error.error?.detail) {
            errorMessage = error.error.detail;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          return throwError(() => new Error(errorMessage));
        } else if (error.status === 500) {
          return throwError(() => new Error('Lỗi server. Vui lòng thử lại sau.'));
        }
        
        return throwError(() => new Error('Không thể tạo điểm. Vui lòng thử lại sau.'));
      })
    );
  }

  // hàm xóa điểm
  deletePoint(pointId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}${MAP_CONSTANTS.ENDPOINTS.POINTS}/${pointId}`;
    return this.http.delete(url, { headers });
  }
} 