import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
// Lấy ID của bản đồ từ service
export class MapShareService {
  private mapIdSource = new BehaviorSubject<number | null>(null);
  currentMapId$ = this.mapIdSource.asObservable();

  setMapId(id: number) {
    this.mapIdSource.next(id);
  }
} 