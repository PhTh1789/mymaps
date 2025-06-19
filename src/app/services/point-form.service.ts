import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PointFormService {
  private showFormSubject = new BehaviorSubject<boolean>(false);
  private selectedGeomSubject = new BehaviorSubject<string | null>(null);
  private selectedMapIdSubject = new BehaviorSubject<number | null>(null);
  private selectedMapNameSubject = new BehaviorSubject<string>('');

  showForm$ = this.showFormSubject.asObservable();
  selectedGeom$ = this.selectedGeomSubject.asObservable();
  selectedMapId$ = this.selectedMapIdSubject.asObservable();
  selectedMapName$ = this.selectedMapNameSubject.asObservable();

  showPointForm(mapId: number, mapName: string, geom: string) {
    this.selectedMapIdSubject.next(mapId);
    this.selectedMapNameSubject.next(mapName);
    this.selectedGeomSubject.next(geom);
    this.showFormSubject.next(true);
  }

  hidePointForm() {
    this.showFormSubject.next(false);
    this.selectedGeomSubject.next(null);
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
} 