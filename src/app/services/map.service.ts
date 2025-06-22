import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { MapApiService, MapItem, CreateMapRequest, CreatePointRequest, TemplateItem } from './map-api.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private mapsSubject = new BehaviorSubject<MapItem[]>([]);
  maps$ = this.mapsSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private mapApiService: MapApiService) {}

  fetchUserMaps(): Observable<MapItem[]> {
    this.isLoadingSubject.next(true);
    return this.mapApiService.getMaps().pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Method để lấy thông tin map theo ID
  getMapById(mapId: string): Observable<MapItem> {
    this.isLoadingSubject.next(true);
    return this.mapApiService.getMapById(mapId).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createMap(mapData: CreateMapRequest): Observable<any> {
    // Validate name bắt buộc
    if (!mapData.name || mapData.name.trim().length < 2) {
      return throwError(() => new Error('Tên bản đồ phải có ít nhất 2 ký tự'));
    }
    
    this.isLoadingSubject.next(true);
    return this.mapApiService.createMap(mapData).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateMap(mapId: string, mapData: Partial<CreateMapRequest>): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.mapApiService.updateMap(mapId, mapData).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteMap(mapId: string): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.mapApiService.deleteMap(mapId).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  toPublicMap(mapId: string): Observable<any> {
    return this.mapApiService.toPublicMap(mapId);
  }

  toPrivateMap(mapId: string): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.mapApiService.toPrivateMap(mapId).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createPoint(pointData: CreatePointRequest): Observable<any> {
    return this.mapApiService.createPoint(pointData);
  }

  deletePoint(pointId: string): Observable<any> {
    return this.mapApiService.deletePoint(pointId);
  }

  getTemplates(): Observable<TemplateItem[]> {
    this.isLoadingSubject.next(true);
    return this.mapApiService.getTemplates().pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}
