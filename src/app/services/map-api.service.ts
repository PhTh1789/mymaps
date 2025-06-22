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

  // Method test để kiểm tra kết nối API
  testConnection(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getAccessToken()}`,
      'Accept': 'application/json'
    });
    
    console.log('=== TEST API CONNECTION ===');
    console.log('Testing URL:', `${this.apiUrl}${MAP_CONSTANTS.ENDPOINTS.MAPS}`);
    console.log('Headers:', headers);
    console.log('===========================');
    
    return this.http.get(`${this.apiUrl}${MAP_CONSTANTS.ENDPOINTS.MAPS}`, { headers }).pipe(
      tap(response => {
        console.log('=== CONNECTION SUCCESS ===');
        console.log('Response:', response);
        console.log('==========================');
      }),
      catchError((error: HttpErrorResponse) => {
        console.log('=== CONNECTION ERROR ===');
        console.log('Error:', error);
        console.log('Status:', error.status);
        console.log('Message:', error.message);
        console.log('========================');
        return throwError(() => error);
      })
    );
  }

  // Method test để kiểm tra dữ liệu trước khi gửi
  testMapData(mapData: CreateMapRequest): void {
    console.log('=== TEST MAP DATA ===');
    console.log('Original mapData:', mapData);
    console.log('Name:', mapData.name, 'Type:', typeof mapData.name);
    console.log('Desc:', mapData.desc, 'Type:', typeof mapData.desc);
    console.log('Img:', mapData.img, 'Type:', typeof mapData.img);
    console.log('Category:', mapData.category, 'Type:', typeof mapData.category);
    console.log('Share:', mapData.share, 'Type:', typeof mapData.share);
    console.log('========================');
  }

  createMap(mapData: CreateMapRequest): Observable<any> {
    // Test dữ liệu trước khi xử lý
    this.testMapData(mapData);
    
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
      tap(response => {
        console.log('✅ Create map thành công:', response);
      }),
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
      tap(response => {
        console.log('✅ Xóa map thành công:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Lỗi xóa map:', error.status, error.message);
        return throwError(() => error);
      })
    );
  }

  // Method test để thử các format khác nhau cho API template
  testTemplateFormats(mapId: string): void {
    console.log('=== TEST TEMPLATE FORMATS ===');
    console.log('Original Map ID:', mapId, 'Type:', typeof mapId);
    console.log('ParseInt:', parseInt(mapId), 'Type:', typeof parseInt(mapId));
    console.log('Number():', Number(mapId), 'Type:', typeof Number(mapId));
    console.log('String:', String(mapId), 'Type:', typeof String(mapId));
    console.log('============================');
  }

  // Method test để thử các endpoint khác nhau
  testTemplateEndpoints(mapId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getAccessToken()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    const endpoints = [
      `${this.apiUrl}/template/`,
      `${this.apiUrl}/template`,
      `${this.apiUrl}/maps/${mapId}/template`,
      `${this.apiUrl}/maps/${mapId}/public`,
      `${this.apiUrl}/public/${mapId}`
    ];
    
    console.log('=== TEST TEMPLATE ENDPOINTS ===');
    endpoints.forEach((endpoint, index) => {
      console.log(`${index + 1}. ${endpoint}`);
    });
    console.log('==============================');
    
    // Thử endpoint đầu tiên
    return this.http.post(endpoints[0], { map_id: mapId }, { headers });
  }

  // Method test để thử public map với các endpoint khác nhau
  testPublicMap(mapId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getAccessToken()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    const mapIdInt = parseInt(mapId);
    if (isNaN(mapIdInt)) {
      return throwError(() => new Error('Map ID không hợp lệ. Phải là số nguyên.'));
    }
    
    const testCases = [
      {
        name: 'POST /template/ with map_id in body',
        url: `${this.apiUrl}/template/`,
        payload: { map_id: mapIdInt }
      },
      {
        name: 'POST /template/?map_id with map_id in body',
        url: `${this.apiUrl}/template/?map_id=${mapIdInt}`,
        payload: { map_id: mapIdInt }
      },
      {
        name: 'POST /template/?map_id with empty body',
        url: `${this.apiUrl}/template/?map_id=${mapIdInt}`,
        payload: {}
      },
      {
        name: 'POST /maps/{id}/template',
        url: `${this.apiUrl}/maps/${mapIdInt}/template`,
        payload: {}
      }
    ];
    
    console.log('=== TEST PUBLIC MAP ENDPOINTS ===');
    testCases.forEach((testCase, index) => {
      console.log(`${index + 1}. ${testCase.name}`);
      console.log(`   URL: ${testCase.url}`);
      console.log(`   Payload:`, testCase.payload);
    });
    console.log('==================================');
    
    // Thử test case đầu tiên
    const testCase = testCases[0];
    console.log(`🔄 Testing: ${testCase.name}`);
    
    return this.http.post(testCase.url, testCase.payload, { headers }).pipe(
      tap(response => {
        console.log(`✅ ${testCase.name} thành công:`, response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`❌ ${testCase.name} thất bại:`, error.status, error.message);
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
    
    console.log('=== TO PUBLIC MAP ===');
    console.log('Map ID:', mapIdInt);
    console.log('URL:', url);
    console.log('Payload:', payload);
    console.log('========================');
    
    return this.http.post(url, payload, { headers }).pipe(
      tap(response => {
        console.log('✅ Public map thành công:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Lỗi public map:', error.status, error.message);
        console.error('Error details:', error);
        
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
      tap(response => {
        console.log('✅ Chuyển map về private thành công:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Lỗi chuyển map về private:', error.status, error.message);
        return throwError(() => error);
      })
    );
  }

  // Method mới để toggle share status của map
  toggleMapShare(mapId: string, currentShareStatus: boolean, mapData?: Partial<CreateMapRequest>): Observable<any> {
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
    
    const url = `${this.apiUrl}/map/?map_id=${mapIdInt}`;
    
    // Tạo payload theo cấu trúc yêu cầu
    // Sử dụng dữ liệu từ mapData nếu có, nếu không thì sử dụng giá trị mặc định
    const payload = {
      name: mapData?.name || '',
      desc: mapData?.desc || '',
      img: mapData?.img || '',
      share: !currentShareStatus // Toggle share status
    };
    
    console.log('=== TOGGLE MAP SHARE ===');
    console.log('Map ID:', mapIdInt);
    console.log('Current Share Status:', currentShareStatus);
    console.log('New Share Status:', !currentShareStatus);
    console.log('Payload:', payload);
    console.log('URL:', url);
    console.log('========================');
    
    return this.http.put(url, payload, { headers }).pipe(
      tap(response => {
        const newStatus = !currentShareStatus ? 'public' : 'private';
        console.log(`✅ Chuyển map sang ${newStatus} thành công:`, response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Lỗi toggle map share:', error.status, error.message);
        
        // Xử lý các loại lỗi cụ thể
        if (error.status === 400) {
          return throwError(() => new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'));
        } else if (error.status === 404) {
          return throwError(() => new Error('Không tìm thấy bản đồ cần cập nhật.'));
        } else if (error.status === 500) {
          return throwError(() => new Error('Lỗi server. Vui lòng thử lại sau.'));
        }
        
        return throwError(() => new Error('Không thể cập nhật trạng thái bản đồ. Vui lòng thử lại sau.'));
      })
    );
  }

  getTemplates(): Observable<TemplateItem[]> {
    return this.http.get<TemplateResponse[]>(`${this.apiUrl}/template/`, { headers: this.getAuthHeaders() }).pipe(
      tap(response => {
        console.log('✅ Get templates thành công:', response);
      }),
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