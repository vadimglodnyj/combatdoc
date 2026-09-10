import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CareSegment, ClinicalPage, Consultation } from '../models/service-member.model';

export interface ConsultationWriteDto {
  episodeId?: string;
  kind?: 'VISIT' | 'EXAM';
  status?: 'PLANNED' | 'DONE' | 'CANCELLED';
  facilityId?: string;
  practitionerRoleId?: string;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  outcome?: {
    kind: 'NONE' | 'CONSULTATION' | 'EXAM' | 'CARE_SEGMENT';
    type?: string;
    facilityId?: string;
    practitionerRoleId?: string;
    scheduledDate?: string;
    notes?: string;
  };
}

export interface CareSegmentWriteDto {
  episodeId?: string;
  type?: string;
  facilityId?: string;
  dateFrom?: string;
  dateTo?: string;
  documentNumber?: string;
  diagnosis?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClinicalService {
  constructor(private http: HttpClient) {}

  listConsultations(query?: Record<string, string | number | boolean | undefined>) {
    return this.http.get<ClinicalPage<Consultation>>(`${environment.apiUrl}/consultations`, {
      params: this.toParams(query),
    });
  }

  listSegments(query?: Record<string, string | number | boolean | undefined>) {
    return this.http.get<ClinicalPage<CareSegment>>(`${environment.apiUrl}/care-segments`, {
      params: this.toParams(query),
    });
  }

  createConsultation(dto: ConsultationWriteDto): Observable<Consultation> {
    return this.http.post<Consultation>(`${environment.apiUrl}/consultations`, dto);
  }

  updateConsultation(id: string, dto: ConsultationWriteDto): Observable<Consultation> {
    return this.http.patch<Consultation>(`${environment.apiUrl}/consultations/${id}`, dto);
  }

  completeConsultation(id: string, dto: ConsultationWriteDto = {}): Observable<Consultation> {
    return this.http.post<Consultation>(`${environment.apiUrl}/consultations/${id}/complete`, dto);
  }

  cancelConsultation(id: string): Observable<Consultation> {
    return this.http.post<Consultation>(`${environment.apiUrl}/consultations/${id}/cancel`, {});
  }

  dispatchConsultation(id: string): Observable<{ sent: boolean; text: string }> {
    return this.http.post<{ sent: boolean; text: string }>(
      `${environment.apiUrl}/consultations/${id}/dispatch`,
      {},
    );
  }

  createSegment(dto: CareSegmentWriteDto): Observable<CareSegment> {
    return this.http.post<CareSegment>(`${environment.apiUrl}/care-segments`, dto);
  }

  updateSegment(id: string, dto: CareSegmentWriteDto): Observable<CareSegment> {
    return this.http.patch<CareSegment>(`${environment.apiUrl}/care-segments/${id}`, dto);
  }

  closeSegment(id: string, dateTo?: string): Observable<CareSegment> {
    return this.http.post<CareSegment>(`${environment.apiUrl}/care-segments/${id}/close`, {
      dateTo,
    });
  }

  prolongSegment(id: string, dateTo: string): Observable<CareSegment> {
    return this.http.post<CareSegment>(`${environment.apiUrl}/care-segments/${id}/prolong`, {
      dateTo,
    });
  }

  transitionSegment(id: string, dto: CareSegmentWriteDto): Observable<CareSegment> {
    return this.http.post<CareSegment>(`${environment.apiUrl}/care-segments/${id}/transition`, dto);
  }

  dispatchSegment(id: string, chats?: Array<1 | 2>): Observable<{ sent: boolean; text: string }> {
    return this.http.post<{ sent: boolean; text: string }>(
      `${environment.apiUrl}/care-segments/${id}/dispatch`,
      { chats },
    );
  }

  remindPlanned(query?: { onDate?: string; includeUnscheduled?: boolean }) {
    return this.http.post<{ sent: number }>(
      `${environment.apiUrl}/consultations/remind-planned`,
      {},
      { params: this.toParams(query) },
    );
  }

  private toParams(query?: Record<string, string | number | boolean | undefined>): HttpParams {
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
