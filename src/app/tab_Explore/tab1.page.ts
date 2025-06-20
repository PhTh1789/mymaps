import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import 'ionicons';
import { MenuController } from '@ionic/angular';
import { MapShareService } from '../services/map-share.service';
import { DocumentService } from '../services/document.service';
import { Subscription } from 'rxjs';
import { TabLabels } from '../tab-labels';
import { MapService } from '../services/map.service';
import { PointFormService } from '../services/point-form.service';
import { AuthService } from '../services/auth.service';

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

  private map!: L.Map; //khai báo biến map, !: đảm bảo kết quả không phải null hoặc undefined
  private currentLocationMarker: L.Marker | null = null; //biến điểm đánh dấu, giá trị ban đầu = null, kết quả có thể là 1 điểm hoặc null
  private locationControl!: L.Control; // gán cho biến một lớp công cụ điều khiển của leaflet
  private searchMarker: L.Marker | null = null;
  private CORS_PROXY = 'https://corsproxy.io/?'; // dòng này để tránh lỗi CORS thông qua proxy
  private currentTileLayer!: L.TileLayer; // tạo biến currentTileLayer, kiểu L.TileLayer, dảm bảo không phải null hoặc undefined
  private isTerrainMode: boolean = false;
  private isRoutingMode: boolean = false; // Thêm biến lưu trạng thái chế độ dẫn đường
  searchQuery: string = '';
  searchResults: any[] = [];
  selectedMapId: number | null = null; // id của map đã chọn từ template
  selectedMapName: string = ''; // Tên của map đang được chọn
  selectedMapOwnerId: string = ''; // ID của chủ sở hữu map
  private pointMarkers: L.Marker[] = []; //mảng chứa tất cả marker đang hiển thị
  private mapIdSub?: Subscription;
  loadingPoint = false;
  private routeControl: any = null; // control để hiển thị đường đi

  // Getter để expose service ra template
  get pointFormServiceInstance() {
    return this.pointFormService;
  }

  //khởi tạo menu
  constructor(
    private menuCtrl: MenuController,
    private mapShareService: MapShareService,
    private documentService: DocumentService,
    private mapService: MapService,
    private pointFormService: PointFormService,
    private authService: AuthService
  ) {}
  ngAfterViewInit() {
    this.initMap();
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  ngOnInit() {
    this.mapIdSub = this.mapShareService.currentMapId$.subscribe((id) => {
      if (id) {
        this.selectedMapId = id;
        this.loadMapName(id);

        this.documentService.getMapPoints(id).subscribe((points) => {
          this.clearPointMarkers();
          points.forEach((point) => {
            const latlng = wkbHexToLatLng(point.geom);
            if (latlng) {
              const marker = L.marker([latlng.lat, latlng.lon], {
                icon: L.icon({
                  iconUrl: '../assets/icon/location-icon.png',
                  iconSize: [40, 40],
                }),
              }).addTo(this.map).bindPopup(`
                <div style="display: flex; align-items: flex-start; width: 280px; padding: 8px;">
                  <div style="flex: 2; padding: 4px; max-width: 150px;">
                    <div style="font-size: 1em; font-weight: bold; margin-bottom: 0.25em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${
                        point.name.length > 10
                          ? point.name.substring(0, 25) + '...'
                          : point.name
                      }
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
                    ${
                      point.image_url
                        ? `<img src="${point.image_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; border: 1px solid #222;" onerror="this.onerror=null; this.src='../assets/default-image.png';" loading="lazy" />`
                        : ''
                    }
                  </div>
                </div>
              `);
              this.documentService.getMapPoints(id).subscribe((points) => {
                this.clearPointMarkers();
                points.forEach((point) => {
                  const latlng = wkbHexToLatLng(point.geom);
                  if (latlng) {
                    const marker = L.marker([latlng.lat, latlng.lon], {
                      icon: L.icon({
                        iconUrl: '../assets/icon/location-icon.png',
                        iconSize: [40, 40],
                      }),
                    }).addTo(this.map).bindPopup(`
                <div style="display: flex; align-items: flex-start; width: 280px; padding: 8px;">
                  <div style="flex: 2; padding: 4px; max-width: 150px;">
                    <div style="font-size: 1em; font-weight: bold; margin-bottom: 0.25em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${
                        point.name.length > 10
                          ? point.name.substring(0, 25) + '...'
                          : point.name
                      }
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
                    ${
                      point.image_url
                        ? `<img src="${point.image_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; border: 1px solid #222;" onerror="this.onerror=null; this.src='../assets/default-image.png';" loading="lazy" />`
                        : ''
                    }
                  </div>
                </div>
              `);
                  }
                });
              });
            }
            // Sử dụng hàm tối ưu để load các điểm
            this.reloadMapPoints();
          });
        });
      }
    });
  }

  ngOnDestroy() {
    this.mapIdSub?.unsubscribe(); // hủy subscription của mapidsub khi chuyển tab hoặc tắt ứng dụng
    this.clearPointMarkers(); // xóa tất cả marker trên map
  }

  ionViewWillEnter() {
    this.mapShareService.currentMapId$.subscribe((id) => {
      // khi map_id được chọn thay đổi, gán cái mới vào id
      this.selectedMapId = id;
      console.log('Selected map_id:', id);
      if (id) {
        this.documentService.getMapPoints(id).subscribe((data) => {
          console.log('Dữ liệu trả về từ getMapPoints:', data);
        });
      }
    });
  }

  //hàm mở menu
  async openMenu() {
    await this.menuCtrl.open();
  }

  // hàm xử lý tìm kiếm
  async onSearchChange(event: any) {
    // Định dạng hàm không đồng bộ async để việc sử dụng await không ảnh hưởng tới chương trình
    const query = event.detail.value; // gắn giá trị input vào biến query khi người dùng nhập từ khóa
    if (query && query.length > 3) {
      try {
        // Sử dụng trực tiếp proxy đáng tin cậy
        const response = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(
            // dòng này để tránh lỗi CORS
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              query
            )}&limit=5` // api nominatim, lấy kết quả tương ứng với từ khóa (query) dưới dạng json gán vào biến response với số lượng < 5
          )}`
        );

        if (!response.ok) {
          // kiểm tra xem có nhận dc api không
          throw new Error(`Lỗi kết nối: ${response.status}`);
        }

        const results = await response.json();

        if (!Array.isArray(results)) {
          // kiểm tra xem có phải mảng không
          throw new Error('Dữ liệu không hợp lệ');
        }

        this.searchResults = results.map((item: any) => ({
          // chia kết quả dc phản hồi  vào các biến, trong đó lat lon chuyển về dạng float
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
  //gắn điểm tìm kiếm vào bản đồ
  selectLocation(location: any) {
    if (this.searchMarker) {
      // có rồi thì xóa
      this.map.removeLayer(this.searchMarker);
    }

    this.searchMarker = L.marker([location.lat, location.lon], {
      // chưa có thì tạo cái mới với lat lon mới lấy được ở trên
      icon: L.icon({
        iconUrl: '../assets/icon/result-point-icon.png',
        iconSize: [25, 40],
      }),
    }).addTo(this.map);

    // căn giữa điểm địa lý trên bản đồ theo kích thước của màn hình
    const headerHeight =
      document.querySelector('ion-header')?.clientHeight || 0; // tìm phần tử header, nếu không có thì trả về 0
    const point = this.map.project([location.lat, location.lon], 16);
    point.y -= headerHeight / 2; // Điều chỉnh vị trí y để tính đến chiều cao của header
    const adjustedLatLng = this.map.unproject(point, 16);

    // Di chuyển map đến vị trí đã điều chỉnh
    this.map.setView(adjustedLatLng, 16, {});

    this.searchResults = [];
  }

  //xóa kết quả tìm kiếm, xóa marker tìm kiếm
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
    this.addRoutingControl(); // Thêm control bật/tắt chế độ dẫn đường
    // Thêm sự kiện click trên bản đồ để hiển thị popup tạo điểm
    this.map.on('click', (e: any) => {
      if (!this.selectedMapId) {
        // Không làm gì khi chưa chọn map
        return;
      }

      // Kiểm tra quyền tạo điểm
      const currentUserId = this.authService.getUserId();
      console.log('=== DEBUG CLICK PERMISSION ===');
      console.log('Clicked at:', e.latlng);
      console.log(
        'Current User ID:',
        currentUserId,
        'Type:',
        typeof currentUserId
      );
      console.log(
        'Map Owner ID:',
        this.selectedMapOwnerId,
        'Type:',
        typeof this.selectedMapOwnerId
      );

      // Chuyển đổi cả hai về string để so sánh
      const currentUserIdString = String(currentUserId);
      const mapOwnerIdString = String(this.selectedMapOwnerId);
      const hasPermission = currentUserIdString === mapOwnerIdString;

      console.log('Current User ID (string):', currentUserIdString);
      console.log('Map Owner ID (string):', mapOwnerIdString);
      console.log('Permission Check:', hasPermission);
      console.log('=============================');

      if (!hasPermission) {
        // Hiển thị thông báo rằng người dùng không có quyền tạo điểm
        console.log(
          '❌ Permission DENIED - User cannot create points on this map'
        );
        this.showPermissionDeniedPopup(e.latlng);
        return;
      }

      console.log('✅ Permission GRANTED - User can create points on this map');

      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      const geom = lon + ' ' + lat;

      // Tạo popup với thông tin vị trí và nút tạo điểm
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

      // Thêm event listener cho nút tạo điểm
      setTimeout(() => {
        const createBtn = document.getElementById('createPointBtn');
        if (createBtn) {
          createBtn.addEventListener('click', () => {
            this.pointFormServiceInstance.showPointForm(
              this.selectedMapId!,
              this.selectedMapName,
              geom,
              this.selectedMapOwnerId
            );
            this.map.closePopup();
          });
        }
      }, 100);
    });
  }
  //  hàm tạo nút định vị không trả về giá trị (void)
  private addLocationControl(): void {
    // Tạo nút định vị từ lớp L.control đặt ở vị trí topright
    const locationButton = L.Control.extend({
      options: {
        position: 'topright',
      },
      //định dạng nút định vị, và gắn chức năng từ hàm getCurrentLocation()
      onAdd: (map: L.Map) => {
        // phương thức onAdd nhận tham số map: L.Map, định dạng nút định vị
        const btn = L.DomUtil.create('button', 'location-button'); //tiện ích DomUtil.create tạo 1 button thêm vào DOM không cần thông qua html, cho phép chỉnh css ngay lập tức
        btn.innerHTML =
          '<img src="../assets/icon/marker-icon.png" alt="Location Icon" class="location-icon">'; //đặt vào phần tử một nội dung từ html bằng hàm innerHTML mà cụ thể là cái iconnn
        btn.style.width = '35px';
        btn.style.height = '35px';
        btn.style.backgroundColor = 'white';
        btn.style.border = '5px solid rgba(255, 255, 255, 0.2)';
        btn.style.borderRadius = '4px';
        // chạy hàm getCurrentLocation() khi click vào
        btn.addEventListener('click', () => {
          this.getCurrentLocation();
        });

        return btn;
      },
    });

    // tạo ra đối tượng mới từ lớp locationbutton mới được định nghĩa và gán vào biến locationControl, nhằm chỉnh sửa và thay đổi thông qua locationControl
    this.locationControl = new locationButton().addTo(this.map);
  }
  //hàm lấy vị trí hiện tại của người dùng
  private getCurrentLocation(): void {
    // tạo hàm getCurrentLocation() không trả về giá trị (void)
    if ('geolocation' in navigator) {
      // kiểm tra sự tồn tại của API geolocation trong navigator, API này có sẵn trong trình duyệt cung cấp tọa độ khi ng dùng cho cmn phép
      navigator.geolocation.getCurrentPosition(
        // gọi hàm getCurrentPosition() của API có sẵn và trả về positon, sau đó gán kinh độ và vĩ độ từ position.coords vào biến latitude và longitude
        (position) => {
          const { latitude, longitude } = position.coords;

          this.map.setView([latitude, longitude], 18);

          // Xóa marker cũ (nếu có)
          if (this.currentLocationMarker) {
            this.map.removeLayer(this.currentLocationMarker);
          }

          // Tạo marker mới bằng hàm L.marker
          this.currentLocationMarker = L.marker([latitude, longitude], {
            icon: L.icon({
              iconUrl: '../assets/icon/current-location.png',
              iconSize: [50, 50],
            }),
          }).addTo(this.map);
        },
        (error) => {
          console.error('Lỗi khi lấy vị trí:', error);
        }
      );
    } else {
      console.error('Trình duyệt không hỗ trợ định vị');
    }
  }
  //tạo nút bản đồ độ cao, định dạng L.Control, vị trí dưới cùng bên phải
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
          this.toggleTerrainMap(); // chạy hàm toggleTerrainMap() khi click vào
        });

        return btn;
      },
    });

    // gắn nút vào map
    new terrainButton().addTo(this.map);
  }
  // hàm chuyển đổi bản đồ độ cao
  private toggleTerrainMap(): void {
    if (this.currentTileLayer) {
      // xóa lớp bản đồ bất kỳ hiện tại
      this.map.removeLayer(this.currentTileLayer);
    }

    if (!this.isTerrainMode) {
      // Chuyển sang bản đồ địa hình
      this.currentTileLayer = L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenTopoMap contributors',
        }
      ).addTo(this.map);
    } else {
      // Chuyển về bản đồ thường
      this.currentTileLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap contributors',
        }
      ).addTo(this.map);
    }

    this.isTerrainMode = !this.isTerrainMode; // đảo ngược giá trị của biến isTerrainMode
  }
  // hàm xóa mảng pointMarkers chứa tất cả điểm trên map
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

  // hàm tạo điểm mới
  onSubmitPoint(data: any) {
    // kiểm tra xem có chọn map và điểm mới không
    const mapId = this.pointFormServiceInstance.getSelectedMapId();
    const geom = this.pointFormServiceInstance.getSelectedGeom();

    if (!mapId || !geom) return;

    this.loadingPoint = true;

    this.mapService
      .createPoint(mapId.toString(), {
        map_id: mapId.toString(),
        name: data.name,
        description: data.description,
        image: data.image,
        geom: geom,
      })
      .subscribe({
        next: () => {
          // khi tạo điểm mới thành công
          this.loadingPoint = false;
          this.pointFormServiceInstance.hidePointForm();

          // Reload lại các điểm trên bản đồ
          this.reloadMapPoints();
        },
        error: (error) => {
          // khi có lỗi
          this.loadingPoint = false;
          console.error('Lỗi khi tạo điểm:', error);
          // Có thể thêm thông báo lỗi cho người dùng ở đây
        },
      });
  }

  // Hàm tối ưu để reload các điểm trên bản đồ
  private reloadMapPoints() {
    if (!this.selectedMapId) return;

    this.documentService
      .getMapPoints(this.selectedMapId)
      .subscribe((points) => {
        this.clearPointMarkers();
        this.addPointsToMap(points);
      });
  }

  // Hàm tối ưu để thêm các điểm lên bản đồ
  private addPointsToMap(points: any[]) {
    points.forEach((point) => {
      const latlng = wkbHexToLatLng(point.geom);
      if (latlng) {
        const marker = this.createPointMarker(point, latlng);
        this.pointMarkers.push(marker);
      }
    });
  }

  // Hàm tối ưu để tạo marker cho điểm
  private createPointMarker(
    point: any,
    latlng: { lat: number; lon: number }
  ): L.Marker {
    const marker = L.marker([latlng.lat, latlng.lon], {
      icon: L.icon({
        iconUrl: '../assets/icon/location-icon.png',
        iconSize: [40, 40],
      }),
    }).addTo(this.map);
    // Xóa nút 'Dẫn đường tới đây' khỏi popup, chỉ còn thông tin điểm
    marker.bindPopup(this.createPointPopupContent(point, false));
    // Thêm sự kiện click marker để dẫn đường nếu đang bật chế độ
    marker.on('click', (e: any) => {
      if (this.isRoutingMode) {
        // Lấy vị trí hiện tại của người dùng
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              // Xóa route cũ nếu có
              if (this.routeControl) {
                this.map.removeLayer(this.routeControl);
                this.routeControl = null;
              }
              // Xóa marker vị trí người dùng cũ nếu có
              if (this.currentLocationMarker) {
                this.map.removeLayer(this.currentLocationMarker);
                this.currentLocationMarker = null;
              }
              // Tạo marker mới cho vị trí người dùng
              this.currentLocationMarker = L.marker([latitude, longitude], {
                icon: L.icon({
                  iconUrl: '../assets/icon/current-location.png',
                  iconSize: [40, 40],
                }),
              }).addTo(this.map);
              // Vẽ đường đi từ vị trí hiện tại đến điểm này
              this.drawRouteFromTo(
                [latitude, longitude],
                [latlng.lat, latlng.lon]
              );
            },
            (error) => {
              alert('Không lấy được vị trí hiện tại của bạn!');
            }
          );
        } else {
          alert('Trình duyệt không hỗ trợ định vị!');
        }
        // Không mở popup khi đang ở chế độ dẫn đường
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
    });
    return marker;
  }

  // Hàm tối ưu để tạo nội dung popup cho điểm
  private createPointPopupContent(
    point: any,
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
    return `
      <div style="display: flex; align-items: flex-start; width: 280px; padding: 8px;">
        <div style="flex: 2; padding: 4px; max-width: 150px;">
          <div style="font-size: 1em; font-weight: bold; margin-bottom: 0.25em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${truncatedName}
          </div>
          <div style="font-size: 0.8em; color: #222; word-wrap: break-word; max-height: 80px; overflow-y: auto;">
            ${truncatedDescription}
          </div>
        </div>
        <div style="flex: 1; min-width: 100px; max-width: 120px; height: 100px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          ${imageHtml}
        </div>
      </div>
    `;
  }

  // hàm đóng form tạo điểm mới
  closePointForm() {
    // ẩn form
    this.pointFormServiceInstance.hidePointForm();
  }

  // hàm lấy tên map từ MapService
  loadMapName(mapId: number) {
    // gọi hàm getMaps() của MapService để lấy danh sách map
    this.mapService.getMaps().subscribe({
      next: (maps: any[]) => {
        // tìm map có map_id tương ứng với mapId
        const selectedMap = maps.find((map) => map.map_id === mapId);
        // kiểm tra xem map có tồn tại và có tên không
        this.selectedMapName = selectedMap?.name || 'Bản đồ';
        this.selectedMapOwnerId = selectedMap?.user_id || '';

        // Debug: In ra thông tin user_id và kiểu dữ liệu
        const currentUserId = this.authService.getUserId();
        console.log('=== DEBUG MAP OWNERSHIP ===');
        console.log('Map ID:', mapId, 'Type:', typeof mapId);
        console.log(
          'Map Name:',
          this.selectedMapName,
          'Type:',
          typeof this.selectedMapName
        );
        console.log(
          'Map Owner ID (from API):',
          this.selectedMapOwnerId,
          'Type:',
          typeof this.selectedMapOwnerId
        );
        console.log(
          'Current User ID (from AuthService):',
          currentUserId,
          'Type:',
          typeof currentUserId
        );
        console.log('Can Create Points:', this.canCreatePoints());
        console.log('==========================');
      },
      error: (error) => {
        // nếu có lỗi thì gán tên mặc định
        console.error('Lỗi khi lấy tên map:', error);
        this.selectedMapName = 'Bản đồ';
        this.selectedMapOwnerId = '';
      },
    });
  }

  // Hủy chọn map
  clearSelectedMap() {
    // xóa id map
    this.selectedMapId = null;
    // xóa tên map
    this.selectedMapName = '';
    // xóa ID chủ sở hữu map
    this.selectedMapOwnerId = '';
    // xóa tất cả điểm trên map
    this.clearPointMarkers();
  }

  // Hàm hiển thị thông báo quyền tạo điểm
  private showPermissionDeniedPopup(latlng: L.LatLng): void {
    // Tạo popup thông báo quyền tạo điểm
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

  // Kiểm tra xem người dùng hiện tại có quyền tạo điểm trên map đã chọn không
  canCreatePoints(): boolean {
    const currentUserId = this.authService.getUserId();
    const currentUserIdString = String(currentUserId);
    const mapOwnerIdString = String(this.selectedMapOwnerId);
    const canCreate = currentUserIdString === mapOwnerIdString;

    console.log('=== DEBUG CAN CREATE POINTS ===');
    console.log(
      'Current User ID:',
      currentUserId,
      'Type:',
      typeof currentUserId
    );
    console.log(
      'Map Owner ID:',
      this.selectedMapOwnerId,
      'Type:',
      typeof this.selectedMapOwnerId
    );
    console.log('Current User ID (string):', currentUserIdString);
    console.log('Map Owner ID (string):', mapOwnerIdString);
    console.log('Can Create Points:', canCreate);
    console.log('===============================');

    return canCreate;
  }

  // Thêm hàm vẽ route từ vị trí hiện tại đến điểm đích bất kỳ
  private drawRouteFromTo(
    currentLocation: [number, number],
    destination: [number, number]
  ): void {
    // Xóa route cũ nếu có
    if (this.routeControl) {
      this.map.removeLayer(this.routeControl);
      this.routeControl = null;
    }
    //api yêu cầu 1 tuyến đường từ (latlon) điểm đầu đến (latlon)diểm cuối
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
          // Zoom vào tuyến đường
          this.map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
        }
      })
      .catch((error) => {
        alert('Không thể lấy đường đi!');
        console.error('Lỗi khi lấy đường đi:', error);
      });
  }

  // Thêm hàm tạo control bật/tắt chế độ dẫn đường
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
            btn.innerHTML =
              '<span style="font-size:22px; color: white;">🧭</span>';
          } else {
            btn.style.backgroundColor = 'white';
            btn.innerHTML =
              '<span style="font-size:22px; color: inherit;">🧭</span>';
          }
          if (!this.isRoutingMode && this.routeControl) {
            this.map.removeLayer(this.routeControl);
            this.routeControl = null;
          }
        };
        // Đảm bảo các sự kiện chuột khác cũng không lan xuống map
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
// hàm chuyển đổi hex thành double
function hexToDoubleLE(hex: string): number {
  const buffer = new ArrayBuffer(8);
  const dataView = new DataView(buffer);
  for (let i = 0; i < 8; i++) {
    dataView.setUint8(i, parseInt(hex.substr(i * 2, 2), 16));
  }
  return dataView.getFloat64(0, true);
}
