import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PointFormService {
  private showFormSubject = new BehaviorSubject<boolean>(false);
  private selectedGeomSubject = new BehaviorSubject<string | null>(null);
  private selectedMapIdSubject = new BehaviorSubject<number | null>(null);
  private selectedMapNameSubject = new BehaviorSubject<string>('');
  private selectedMapOwnerIdSubject = new BehaviorSubject<string>('');

  showForm$ = this.showFormSubject.asObservable();
  selectedGeom$ = this.selectedGeomSubject.asObservable();
  selectedMapId$ = this.selectedMapIdSubject.asObservable();
  selectedMapName$ = this.selectedMapNameSubject.asObservable();
  selectedMapOwnerId$ = this.selectedMapOwnerIdSubject.asObservable();

  constructor(private authService: AuthService) {}

  showPointForm(mapId: number, mapName: string, geom: string, user_id: string) {
    this.selectedMapIdSubject.next(mapId);
    this.selectedMapNameSubject.next(mapName);
    this.selectedGeomSubject.next(geom);
    this.selectedMapOwnerIdSubject.next(user_id);
    this.showFormSubject.next(true);
  }

  hidePointForm() {
    this.showFormSubject.next(false);
    this.selectedGeomSubject.next(null);
  }

  // Kiểm tra xem người dùng hiện tại có quyền tạo điểm trên map này không
  canCreatePoint(): boolean {
    const currentUserId = this.authService.currentUserInfo?.userId;
    const mapOwnerId = this.selectedMapOwnerIdSubject.value;
    return currentUserId == mapOwnerId;
  }

  getShowForm(): boolean {
    return this.showFormSubject.value;
  }

  getSelectedGeom(): string | null {
    return this.selectedGeomSubject.value;
  }

  getSelectedMapId(): number | null {
    return this.selectedMapIdSubject.value;
  }

  getSelectedMapName(): string {
    return this.selectedMapNameSubject.value;
  }

  getSelectedMapOwnerId(): string {
    return this.selectedMapOwnerIdSubject.value;
  }
} 