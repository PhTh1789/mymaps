import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Map {
  id: string;
  title: string;
  description: string;
  author: string;
}

@Injectable({ providedIn: 'root' })
export class MapService {
  private apiUrl = 'https://api.example.com/maps';

  constructor(private http: HttpClient) {}

  getMaps(): Observable<Map[]> {
    return this.http.get<Map[]>(this.apiUrl);
  }
}
