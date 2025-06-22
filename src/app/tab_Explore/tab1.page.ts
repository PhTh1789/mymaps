import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import 'ionicons';
import { MenuController, AlertController, LoadingController } from '@ionic/angular';
import { MapShareService } from '../services/map-share.service';
import { DocumentService, MapPoint } from '../services/document.service';
import { Subscription } from 'rxjs';
import { TabLabels } from '../tab-labels';
import { MapService } from '../services/map.service';
import { PointFormService } from '../services/point-form.service';
import { AuthService } from '../services/auth.service';
import { Geolocation } from '@capacitor/geolocation';
import { CreatePointRequest } from '../services/map-api.service';
import { ValidationService } from '../services/validation.service';

interface SearchResult {
  display_name: string;
  lat: number;
  lon: number;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit, OnDestroy, AfterViewInit {
  tab1 = TabLabels.tab1;

  private map!: L.Map;
  private currentLocationMarker: L.Marker | null = null;
  private locationControl!: L.Control;
  private searchMarker: L.Marker | null = null;
  private CORS_PROXY = 'https://corsproxy.io/?';
  private currentTileLayer!: L.TileLayer;
  private isTerrainMode: boolean = false;
  private isRoutingMode: boolean = false;
  
  searchQuery: string = '';
  searchResults: any[] = [];
  selectedMapId: number | null = null;
  selectedMapName: string = '';
  selectedMapAuthorId: number | null = null;
  private pointMarkers: L.Marker[] = [];
  private mapIdSub?: Subscription;
  loadingPoint = false;
  loadingDelete = false;
  private routeControl: any = null;
  private markerToDelete: L.Marker | null = null;
  userInfo: any = null;

  // Getter để expose service ra template
  get pointFormServiceInstance() {
    return this.pointFormService;
  }

  constructor(
    private menuCtrl: MenuController,
    private mapShareService: MapShareService,
    private documentService: DocumentService,
    private mapService: MapService,
    private pointFormService: PointFormService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private validationService: ValidationService
  ) {}

  ngAfterViewInit() {
    this.initMap();
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  ngOnInit() {
    this.authService.getCurrentUserInfoNew().subscribe({
      next: (user) => {
        this.userInfo = user;
      },
      error: (err) => {
        console.error('Không lấy được thông tin user:', err);
        this.userInfo = null;
      }
    });

    this.mapIdSub = this.mapShareService.currentMapId$.subscribe((id) => {
      if (id) {
        this.selectedMapId = id;
        this.loadMapName(id);
        this.reloadMapPoints();
      }
    });
  }

  ngOnDestroy() {
    this.mapIdSub?.unsubscribe();
    this.clearPointMarkers();
  }

  ionViewWillEnter() {
    this.mapShareService.currentMapId$.subscribe((id) => {
      this.selectedMapId = id;
      console.log('Selected map_id:', id);
      if (id) {
        this.documentService.getMapPoints(id).subscribe((data) => {
          console.log('Dữ liệu trả về từ getMapPoints:', data);
        });
      }
    });
  }

  async openMenu() {
    await this.menuCtrl.open();
  }

  async onSearchChange(query: string) {
    if (query && query.length > 3) {
      try {
        const response = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              query
            )}&limit=5`
          )}`
        );

        if (!response.ok) {
          throw new Error(`Lỗi kết nối: ${response.status}`);
        }

        const results = await response.json();

        if (!Array.isArray(results)) {
          throw new Error('Dữ liệu không hợp lệ');
        }

        this.searchResults = results.map((item: any) => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        this.searchResults = [];
      }
    } else {
      this.searchResults = [];
    }
  }

  selectLocation(location: any) {
    if (this.searchMarker) {
      this.map.removeLayer(this.searchMarker);
    }

    this.searchMarker = L.marker([location.lat, location.lon], {
      icon: L.icon({
        iconUrl: '../assets/icon/result-point-icon.png',
        iconSize: [25, 40],
      }),
    }).addTo(this.map);

    const headerHeight = document.querySelector('ion-header')?.clientHeight || 0;
    const point = this.map.project([location.lat, location.lon], 16);
    point.y -= headerHeight / 2;
    const adjustedLatLng = this.map.unproject(point, 16);

    this.map.setView(adjustedLatLng, 16, {});
    this.searchResults = [];
    this.searchQuery = location.display_name;
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    if (this.searchMarker) {
      this.map.removeLayer(this.searchMarker);
      this.searchMarker = null;
    }
  }

  private initMap(): void {
    if (this.map) return;
    this.map = L.map('map').setView(
      [10.870126934968653, 106.79020962591983],
      20
    );
    this.currentTileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {}
    ).addTo(this.map);
    this.addLocationControl();
    this.addTerrainControl();
    this.addRoutingControl();
    
    this.map.on('click', (e: any) => {
      if (!this.selectedMapId) {
        return;
      }

      const currentUserId = this.authService.currentUserInfo?.userId;
      const currentUserIdString = String(currentUserId);
      const mapOwnerIdString = String(this.selectedMapAuthorId);
      const hasPermission = currentUserIdString === mapOwnerIdString;

      if (!hasPermission) {
        this.showPermissionDeniedPopup(e.latlng);
        return;
      }

      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      const geom = lon + ' ' + lat;

      const popup = L.popup()
        .setLatLng([lat, lon])
        .setContent(
          `
          <div style="text-align: center; min-width: 200px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Vị trí mới</h4>
            <p style="margin: 5px 0; font-size: 14px;">
              <strong>Hoành độ:</strong> ${lon.toFixed(6)}
            </p>
            <p style="margin: 5px 0; font-size: 14px;">
              <strong>Tung độ:</strong> ${lat.toFixed(6)}
            </p>
            <button 
              id="createPointBtn" 
              style="
                background: #007bff; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                cursor: pointer; 
                margin-top: 10px;
                font-size: 14px;
              "
              onmouseover="this.style.background='#0056b3'"
              onmouseout="this.style.background='#007bff'"
            >
              Thêm vào ${this.selectedMapName || 'map'}
            </button>
          </div>
        `
        )
        .openOn(this.map);

      setTimeout(() => {
        const createBtn = document.getElementById('createPointBtn');
        if (createBtn) {
          createBtn.addEventListener('click', () => {
            this.pointFormServiceInstance.showPointForm(
              this.selectedMapId!,
              this.selectedMapName,
              geom,
              String(this.selectedMapAuthorId ?? '')
            );
            this.map.closePopup();
          });
        }
      }, 100);
    });
  }

  private addLocationControl(): void {
    const locationButton = L.Control.extend({
      options: {
        position: 'topright',
      },
      onAdd: (map: L.Map) => {
        const btn = L.DomUtil.create('button', 'location-button');
        btn.innerHTML =
          '<img src="../assets/icon/marker-icon.png" alt="Location Icon" class="location-icon">';
        btn.style.width = '35px';
        btn.style.height = '35px';
        btn.style.backgroundColor = 'white';
        btn.style.border = '5px solid rgba(255, 255, 255, 0.2)';
        btn.style.borderRadius = '4px';
        btn.addEventListener('click', () => {
          this.getCurrentLocation();
        });

        return btn;
      },
    });

    this.locationControl = new locationButton().addTo(this.map);
  }

  private async getCurrentLocation(): Promise<void> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      const { latitude, longitude } = position.coords;

      this.map.setView([latitude, longitude], 18);

      if (this.currentLocationMarker) {
        this.map.removeLayer(this.currentLocationMarker);
      }

      this.currentLocationMarker = L.marker([latitude, longitude], {
        icon: L.icon({
          iconUrl: '../assets/icon/current-location.png',
          iconSize: [50, 50],
        }),
      }).addTo(this.map);
    } catch (error: any) {
      console.error('Lỗi khi lấy vị trí (Capacitor Geolocation):', error);
      let message = 'Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí hoặc thử lại.';
      if (error && error.message) {
        message += `<br><small>${error.message}</small>`;
      }
      const alert = await this.alertController.create({
        header: 'Lỗi định vị',
        message: message,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  private addTerrainControl(): void {
    const terrainButton = L.Control.extend({
      options: {
        position: 'bottomright',
      },
      onAdd: (map: L.Map) => {
        const btn = L.DomUtil.create('button', 'terrain-button');
        btn.innerHTML =
          '<img src="../assets/icon/terrain-map-icon.png" alt="terrain Icon" class="terrain-icon">';
        btn.style.width = '35px';
        btn.style.height = '35px';
        btn.style.backgroundColor = 'white';
        btn.style.border = '5px solid rgba(255, 255, 255, 0.2)';
        btn.style.borderRadius = '4px';
        btn.title = 'Chuyển đổi bản đồ địa hình';

        btn.addEventListener('click', () => {
          this.toggleTerrainMap();
        });

        return btn;
      },
    });

    new terrainButton().addTo(this.map);
  }

  private toggleTerrainMap(): void {
    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    if (!this.isTerrainMode) {
      this.currentTileLayer = L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenTopoMap contributors',
        }
      ).addTo(this.map);
    } else {
      this.currentTileLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap contributors',
        }
      ).addTo(this.map);
    }

    this.isTerrainMode = !this.isTerrainMode;
  }

  private clearPointMarkers() {
    if (this.pointMarkers.length > 0) {
      this.pointMarkers.forEach((marker) => {
        if (this.map.hasLayer(marker)) {
          this.map.removeLayer(marker);
        }
      });
      this.pointMarkers = [];
    }
  }

  onSubmitPoint(data: any) {
    const mapId = this.pointFormServiceInstance.getSelectedMapId();
    const geom = this.pointFormServiceInstance.getSelectedGeom();

    if (!mapId || !geom) {
      console.error('Thiếu mapId hoặc geom');
      return;
    }

    this.loadingPoint = true;

    // Đảm bảo map_id là number
    const mapIdInt = parseInt(mapId.toString());
    if (isNaN(mapIdInt)) {
      console.error('Map ID không hợp lệ:', mapId);
      this.loadingPoint = false;
      return;
    }

    // Validate dữ liệu đầu vào
    if (!data.name || data.name.trim().length === 0) {
      console.error('Tên điểm không được để trống');
      this.loadingPoint = false;
      return;
    }

    // Lấy danh sách tên điểm hiện có trong map để kiểm tra trùng lặp
    this.documentService.getMapPoints(mapIdInt).subscribe({
      next: (existingPoints) => {
        const existingPointNames = existingPoints.map(point => point.name);
        
        // Validate tên điểm với danh sách tên hiện có
        const nameValidation = this.validationService.validatePointName(data.name, existingPointNames);
        if (!nameValidation.isValid) {
          this.loadingPoint = false;
          const errorMessage = this.validationService.formatErrorMessage(nameValidation.errors);
          this.showErrorMessage(errorMessage);
          return;
        }

        // Validate description nếu có
        if (data.description && data.description.trim().length > 0) {
          const descValidation = this.validationService.validateDescription(data.description);
          if (!descValidation.isValid) {
            this.loadingPoint = false;
            const errorMessage = this.validationService.formatErrorMessage(descValidation.errors);
            this.showErrorMessage(errorMessage);
            return;
          }
        }

        // Validate geom
        const geomValidation = this.validationService.validateGeom(geom);
        if (!geomValidation.isValid) {
          this.loadingPoint = false;
          const errorMessage = this.validationService.formatErrorMessage(geomValidation.errors);
          this.showErrorMessage(errorMessage);
          return;
        }

        // Xử lý ảnh: chuyển từ File sang base64 string nếu có
        let imageBase64: string | null = null;
        if (data.image && data.image instanceof File) {
          // Validate kích thước file trước khi đọc
          if (data.image.size > 5 * 1024 * 1024) { // 5MB
            this.loadingPoint = false;
            this.showErrorMessage('Kích thước ảnh không được vượt quá 5MB');
            return;
          }

          // Chuyển File thành base64
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const result = e.target.result as string;
            // Loại bỏ prefix "data:image/jpeg;base64," để chỉ lấy phần base64
            imageBase64 = result.split(',')[1];
            
            // Validate base64 image
            const imageValidation = this.validationService.validateImage(imageBase64);
            if (!imageValidation.isValid) {
              this.loadingPoint = false;
              const errorMessage = this.validationService.formatErrorMessage(imageValidation.errors);
              this.showErrorMessage(errorMessage);
              return;
            }
            
            this.createPointWithData(mapIdInt, data, geom, imageBase64);
          };
          reader.onerror = () => {
            console.error('Lỗi khi đọc file ảnh');
            this.loadingPoint = false;
            this.showErrorMessage('Lỗi khi đọc file ảnh. Vui lòng thử lại.');
          };
          reader.readAsDataURL(data.image);
        } else if (data.image && typeof data.image === 'string') {
          // Nếu đã là base64 string
          imageBase64 = data.image;
          
          // Validate base64 image
          if (imageBase64) {
            const imageValidation = this.validationService.validateImage(imageBase64);
            if (!imageValidation.isValid) {
              this.loadingPoint = false;
              const errorMessage = this.validationService.formatErrorMessage(imageValidation.errors);
              this.showErrorMessage(errorMessage);
              return;
            }
          }
          
          this.createPointWithData(mapIdInt, data, geom, imageBase64);
        } else {
          // Không có ảnh
          this.createPointWithData(mapIdInt, data, geom, null);
        }
      },
      error: (error) => {
        console.error('Lỗi khi lấy danh sách điểm hiện có:', error);
        this.loadingPoint = false;
        this.showErrorMessage('Không thể kiểm tra tên điểm. Vui lòng thử lại.');
      }
    });
  }

  private createPointWithData(mapId: number, data: any, geom: string, imageBase64: string | null) {
    const pointData: CreatePointRequest = {
      map_id: mapId,
      name: data.name.trim(),
      desc: data.description?.trim() || null,
      img: imageBase64,
      geom: geom.trim(),
    };

    console.log('📤 Tạo điểm với dữ liệu:', {
      map_id: pointData.map_id,
      name: pointData.name,
      desc: pointData.desc,
      img: pointData.img ? 'Có ảnh (base64)' : 'Không có ảnh',
      geom: pointData.geom
    });

    this.mapService.createPoint(pointData).subscribe({
      next: (response) => {
        console.log('✅ Tạo điểm thành công:', response);
        this.loadingPoint = false;
        this.pointFormServiceInstance.hidePointForm();
        this.reloadMapPoints();
        
        // Hiển thị thông báo thành công
        this.showSuccessMessage('Đã tạo điểm thành công!');
      },
      error: (error: any) => {
        this.loadingPoint = false;
        console.error('❌ Lỗi khi tạo điểm:', error);
        
        // Hiển thị thông báo lỗi
        let errorMessage = 'Không thể tạo điểm. Vui lòng thử lại.';
        
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.showErrorMessage(errorMessage);
      },
    });
  }

  private async showSuccessMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Thành công',
      message: message,
      buttons: ['OK'],
      cssClass: 'success-alert'
    });
    await alert.present();
  }

  private async showErrorMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Lỗi',
      message: message,
      buttons: ['OK'],
      cssClass: 'error-alert'
    });
    await alert.present();
  }

  private reloadMapPoints() {
    if (!this.selectedMapId) return;

    this.documentService.getMapPoints(this.selectedMapId).subscribe((points) => {
      this.clearPointMarkers();
      this.addPointsToMap(points);
    });
  }

  private addPointsToMap(points: MapPoint[]) {
    points.forEach((point) => {
      const latlng = wkbHexToLatLng(point.geom);
      if (latlng) {
        (point as any).latlng = latlng;
        
        const marker = this.createPointMarker(point, latlng);
        this.pointMarkers.push(marker);
      }
    });
  }

  private createPointMarker(
    point: MapPoint,
    latlng: { lat: number; lon: number }
  ): L.Marker {
    const marker = L.marker([latlng.lat, latlng.lon], {
      icon: L.icon({
        iconUrl: '../assets/icon/location-icon.png',
        iconSize: [40, 40],
      }),
    }).addTo(this.map)
      .bindPopup(this.createPointPopupContent(point));

    (marker as any).pointData = point;

    marker.on('popupopen', (e: any) => {
      setTimeout(() => {
        const deleteBtn = document.querySelector('.delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            const pointId = deleteBtn.getAttribute('data-point-id');
            console.log('Delete button clicked with pointId:', pointId);
            if (pointId) {
              this.handleDeletePointClick(pointId, point, marker);
            } else {
              console.error('Không tìm thấy pointId trong button');
            }
          });
        }
      }, 0);
    });
    return marker;
  }

  private createPointPopupContent(
    point: MapPoint,
    showButton: boolean = false
  ): string {
    const truncatedName =
      point.name.length > 25 ? point.name.substring(0, 25) + '...' : point.name;
    const truncatedDescription =
      point.description && point.description.length > 150
        ? point.description.substring(0, 150) + '...'
        : point.description || '';
    const imageHtml = point.image_url
      ? `<img src="${point.image_url}" 
           style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; border: 1px solid #222;"
           onerror="this.onerror=null; this.src='../assets/default-image.png';"
           loading="lazy" />`
      : '';

    const pointId = point.point_id;
    const canDeletePoint = this.canDeletePoint(point);
    const deleteButtonHtml = canDeletePoint && pointId
      ? `<button class='delete-btn' style='padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 8px;' data-point-id='${pointId}'>
           <ion-icon name="trash-outline" style="margin-right: 4px;"></ion-icon>
           Xóa điểm
         </button>`
      : '';
      
    return `
      <div style="display: flex; align-items: flex-start; width: 280px; padding: 8px;">
        <div style="flex: 2; padding: 4px; max-width: 150px;">
          <div style="font-size: 1em; font-weight: bold; margin-bottom: 0.25em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${truncatedName}
          </div>
          <div style="font-size: 0.8em; color: #222; word-wrap: break-word; max-height: 80px; overflow-y: auto;">
            ${
              point.description
                ? point.description.length > 150
                  ? point.description.substring(0, 150) + '...'
                  : point.description
                : ''
            }
          </div>
        </div>
        <div style="flex: 1; min-width: 100px; max-width: 120px; height: 100px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          ${imageHtml}
        </div>
      </div>
      <div style='margin-top: 8px; text-align: right;'>
        ${deleteButtonHtml}
      </div>
    `;
  }

  closePointForm() {
    this.pointFormServiceInstance.hidePointForm();
  }

  loadMapName(mapId: number) {
    this.mapService.fetchUserMaps().subscribe({
      next: (maps: any[]) => {
        const selectedMap = maps.find((map) => map.map_id === mapId || map.id === mapId);
        this.selectedMapName = selectedMap?.name || 'Bản đồ';
        this.selectedMapAuthorId = selectedMap?.author_id ?? null;
      },
      error: (error: any) => {
        console.error('Lỗi khi lấy tên map:', error);
        this.selectedMapName = 'Bản đồ';
        this.selectedMapAuthorId = null;
      },
    });
  }

  clearSelectedMap() {
    this.selectedMapId = null;
    this.selectedMapName = '';
    this.selectedMapAuthorId = null;
    this.clearPointMarkers();
  }

  private showPermissionDeniedPopup(latlng: L.LatLng): void {
    const popup = L.popup()
      .setLatLng(latlng)
      .setContent(
        `
        <div style="text-align: center; min-width: 200px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">Quyền tạo điểm</h4>
          <p style="margin: 5px 0; font-size: 14px;">
            Bạn không có quyền tạo điểm trên bản đồ này.
          </p>
        </div>
      `
      )
      .openOn(this.map);
  }

  canCreatePoints(): boolean {
    if (!this.userInfo || this.selectedMapAuthorId == null) return false;
    return Number(this.userInfo.id) === Number(this.selectedMapAuthorId);
  }

  private drawRouteFromTo(
    currentLocation: [number, number],
    destination: [number, number]
  ): void {
    if (this.routeControl) {
      this.map.removeLayer(this.routeControl);
      this.routeControl = null;
    }
    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${currentLocation[1]},${currentLocation[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
    fetch(routeUrl)
      .then((response) => response.json())
      .then((data) => {
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const routeCoordinates = route.geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]]
          );
          const routeLine = L.polyline(routeCoordinates, {
            color: 'red',
            weight: 2,
          }).addTo(this.map);
          this.routeControl = routeLine;
          this.map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
        }
      })
      .catch((error) => {
        alert('Không thể lấy đường đi!');
        console.error('Lỗi khi lấy đường đi:', error);
      });
  }

  private canDeletePoint(point: MapPoint): boolean {
    const currentUserId = this.authService.currentUserInfo?.userId;
    const currentUserIdString = String(currentUserId);
    const mapOwnerIdString = String(this.selectedMapAuthorId);
    const canDelete = currentUserIdString === mapOwnerIdString;

    return canDelete;
  }

  private async handleDeletePointClick(pointId: string, point: MapPoint, marker?: L.Marker): Promise<void> {
    this.markerToDelete = marker || null;
    
    if (!pointId) {
      console.error('Không có ID điểm để xóa');
      const errorAlert = await this.alertController.create({
        header: 'Lỗi',
        message: 'Không thể xác định ID điểm để xóa.',
        buttons: ['OK']
      });
      await errorAlert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Xác nhận xóa điểm',
      message: `Bạn có chắc chắn muốn xóa điểm "${point.name}" không? Hành động này không thể hoàn tác.`,
      buttons: [
        {
          text: 'Hủy',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Xóa',
          role: 'destructive',
          handler: () => {
            this.deletePoint(pointId, point);
          }
        }
      ]
    });

    await alert.present();
  }

  private async deletePoint(pointId: string, point: MapPoint): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Đang xóa điểm...',
      spinner: 'crescent'
    });
    await loading.present();

    this.loadingDelete = true;

    try {
      const response = await this.mapService.deletePoint(pointId).toPromise();
      
      await loading.dismiss();
      
      if (this.markerToDelete) {
        this.map.removeLayer(this.markerToDelete);
        
        const markerIndex = this.pointMarkers.indexOf(this.markerToDelete);
        if (markerIndex > -1) {
          this.pointMarkers.splice(markerIndex, 1);
        }
        
        this.markerToDelete = null;
      }
      
      const successAlert = await this.alertController.create({
        header: 'Thành công',
        message: `Đã xóa điểm "${point.name}" thành công!`,
        buttons: ['OK']
      });
      await successAlert.present();

    } catch (error: any) {
      console.error('Lỗi khi xóa điểm:', error);
      
      await loading.dismiss();
      
      this.markerToDelete = null;
      
      let errorMessage = 'Không thể xóa điểm. Vui lòng thử lại sau.';
      
      if (error.status === 404) {
        errorMessage = 'Không tìm thấy điểm cần xóa.';
      } else if (error.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      }
      
      const errorAlert = await this.alertController.create({
        header: 'Lỗi',
        message: errorMessage,
        buttons: ['OK']
      });
      await errorAlert.present();
    } finally {
      this.loadingDelete = false;
    }
  }

  private addRoutingControl(): void {
    const routingButton = L.Control.extend({
      options: {
        position: 'bottomleft',
      },
      onAdd: (map: L.Map) => {
        const btn = L.DomUtil.create('button', 'routing-button');
        btn.innerHTML = '<span style="font-size:22px;">🧭</span>';
        btn.style.width = '35px';
        btn.style.height = '35px';
        btn.style.backgroundColor = 'white';
        btn.style.border = '5px solid rgba(255, 255, 255, 0.2)';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.title = 'Bật/tắt chế độ dẫn đường';
        btn.style.transition = 'background 0.2s, color 0.2s';
        btn.onclick = (event) => {
          event.stopPropagation();
          event.preventDefault();
          this.isRoutingMode = !this.isRoutingMode;
          if (this.isRoutingMode) {
            btn.style.backgroundColor = '#51a245';
            btn.innerHTML = '<span style="font-size:22px; color: white;">🧭</span>';
          } else {
            btn.style.backgroundColor = 'white';
            btn.innerHTML = '<span style="font-size:22px; color: inherit;">🧭</span>';
          }
          if (!this.isRoutingMode && this.routeControl) {
            this.map.removeLayer(this.routeControl);
            this.routeControl = null;
          }
        };
        [
          'mousedown',
          'mouseup',
          'dblclick',
          'touchstart',
          'touchend',
          'pointerdown',
          'pointerup',
        ].forEach((evt) => {
          btn.addEventListener(evt, (e) => {
            e.stopPropagation();
          });
        });
        return btn;
      },
    });
    new routingButton().addTo(this.map);
  }
}

// Hàm chuyển đổi WKB hex POINT sang lat/lon
function wkbHexToLatLng(wkb: string): { lat: number; lon: number } | null {
  if (!wkb || wkb.length !== 50) return null;
  const lonHex = wkb.slice(18, 34);
  const latHex = wkb.slice(34, 50);
  const lon = hexToDoubleLE(lonHex);
  const lat = hexToDoubleLE(latHex);
  return { lat, lon };
}

function hexToDoubleLE(hex: string): number {
  const buffer = new ArrayBuffer(8);
  const dataView = new DataView(buffer);
  for (let i = 0; i < 8; i++) {
    dataView.setUint8(i, parseInt(hex.substr(i * 2, 2), 16));
  }
  return dataView.getFloat64(0, true);
}
