import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CareSegment, ClinicalPage, Consultation } from '../models/service-member.model';

@Injectable({
  providedIn: 'root',
})
export class ClinicalService {
  constructor(private http: HttpClient) {}

  listConsultations(query?: {
    search?: string;
    episodeId?: string;
    serviceMemberId?: string;
    page?: number;
    take?: number;
  }): Observable<ClinicalPage<Consultation>> {
    return this.http.get<ClinicalPage<Consultation>>(`${environment.apiUrl}/consultations`, {
      params: this.toParams(query),
    });
  }

  listSegments(query?: {
    search?: string;
    episodeId?: string;
    serviceMemberId?: string;
    page?: number;
    take?: number;
  }): Observable<ClinicalPage<CareSegment>> {
    return this.http.get<ClinicalPage<CareSegment>>(`${environment.apiUrl}/care-segments`, {
      params: this.toParams(query),
    });
  }

  private toParams(query?: Record<string, string | number | undefined>): HttpParams {
    let params = new HttpParams();
    if (!query) return params;
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
