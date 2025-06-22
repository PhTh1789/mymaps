import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { MAP_CONSTANTS } from '../constants/map.constants';

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
  img?: File | null;
  geom: string;
}

@Injectable({
  providedIn: 'root'
})
export class MapApiService {
  private apiUrl = MAP_CONSTANTS.API_URL;

  constructor(
    private http: HttpClient,
    private authService: AuthService
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
    
    // Chỉ gửi name bắt buộc và các trường khác nếu có giá trị
    const jsonData: any = {
      name: mapData.name
    };
    
    // Chỉ thêm các trường có giá trị và không rỗng
    if (mapData.desc !== undefined && mapData.desc !== null && mapData.desc.trim() !== '') {
      jsonData.desc = mapData.desc.trim();
    }
    
    if (mapData.img !== undefined && mapData.img !== null && mapData.img.trim() !== '') {
      jsonData.img = mapData.img.trim();
    }
    
    if (mapData.category !== undefined && mapData.category !== null && mapData.category.trim() !== '') {
      jsonData.category = mapData.category.trim();
    }
    
    if (mapData.share !== undefined && mapData.share !== null) {
      jsonData.share = mapData.share;
    }
    
    return this.http.post(`${this.apiUrl}${MAP_CONSTANTS.ENDPOINTS.MAPS}`, jsonData, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Lỗi tạo map:', error.status, error.message);
        
        // Xử lý các loại lỗi cụ thể
        if (error.status === 0) {
          return throwError(() => new Error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.'));
        } else if (error.status === 400) {
          return throwError(() => new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'));
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

  // hàm tạo điểm
  createPoint(pointData: CreatePointRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    const mapIdInt = parseInt(pointData.map_id.toString());
    if (isNaN(mapIdInt)) {
      return throwError(() => new Error('Map ID không hợp lệ. Phải là số nguyên.'));
    }
    
    const formData = new FormData();
    formData.append('map_id', mapIdInt.toString());
    formData.append('name', pointData.name);
    if (pointData.desc) formData.append('desc', pointData.desc);
    if (pointData.img) formData.append('img', pointData.img);
    formData.append('geom', pointData.geom);
    
    return this.http.post(`${this.apiUrl}${MAP_CONSTANTS.ENDPOINTS.POINTS}`, formData, { headers });
  }

  // hàm xóa điểm
  deletePoint(pointId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}${MAP_CONSTANTS.ENDPOINTS.POINTS}/${pointId}`;
    return this.http.delete(url, { headers });
  }
} 