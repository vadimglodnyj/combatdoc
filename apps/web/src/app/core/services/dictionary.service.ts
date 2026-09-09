import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Rank, Unit } from '../models/service-member.model';
import { environment } from '../../../environments/environment';

export interface Facility {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  popularity: number;
}

export interface PractitionerRole {
  id: string;
  code: string;
  name: string;
  popularity: number;
}

@Injectable({
  providedIn: 'root',
})
export class DictionaryService {
  private apiUrl = `${environment.apiUrl}/dictionaries`;

  constructor(private http: HttpClient) {}

  getRanks(): Observable<Rank[]> {
    return this.http.get<Rank[]>(`${this.apiUrl}/ranks`);
  }

  getUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.apiUrl}/units`);
  }

  getFacilities(): Observable<Facility[]> {
    return this.http.get<Facility[]>(`${this.apiUrl}/facilities`);
  }

  getPractitionerRoles(): Observable<PractitionerRole[]> {
    return this.http.get<PractitionerRole[]>(`${this.apiUrl}/practitioner-roles`);
  }
}
