import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Episode, CreateEpisodeDto, UpdateEpisodeDto, InjuryCertificate } from '../models/service-member.model';

@Injectable({
  providedIn: 'root',
})
export class EpisodeService {
  private apiUrl = `${environment.apiUrl}/episodes`;
  private certUrl = `${environment.apiUrl}/injury-certificates`;

  constructor(private http: HttpClient) {}

  findAll(query?: {
    serviceMemberId?: string;
    nature?: 'COMBAT' | 'SOMATIC';
    isActive?: boolean;
    missingCert?: boolean;
    skip?: number;
    take?: number;
    search?: string;
  }): Observable<{ data: Episode[]; total: number; skip: number; take: number }> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        const value = (query as any)[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<{ data: Episode[]; total: number; skip: number; take: number }>(
      this.apiUrl,
      { params }
    );
  }

  findOne(id: string): Observable<Episode> {
    return this.http.get<Episode>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateEpisodeDto): Observable<Episode> {
    return this.http.post<Episode>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateEpisodeDto): Observable<Episode> {
    return this.http.patch<Episode>(`${this.apiUrl}/${id}`, dto);
  }

  close(id: string): Observable<Episode> {
    return this.http.post<Episode>(`${this.apiUrl}/${id}/close`, {});
  }

  reopen(id: string): Observable<Episode> {
    return this.http.post<Episode>(`${this.apiUrl}/${id}/reopen`, {});
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // Injury Certificate methods
  getCertificate(episodeId: string): Observable<InjuryCertificate> {
    return this.http.get<InjuryCertificate>(`${this.certUrl}/episode/${episodeId}`);
  }

  uploadCertificate(episodeId: string, file: File): Observable<InjuryCertificate> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<InjuryCertificate>(
      `${this.certUrl}/episode/${episodeId}/upload`,
      formData
    );
  }

  updateCertStatus(
    episodeId: string,
    status: 'MISSING' | 'PENDING' | 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
  ): Observable<InjuryCertificate> {
    return this.http.patch<InjuryCertificate>(
      `${this.certUrl}/episode/${episodeId}/status`,
      { status, rejectionReason }
    );
  }

  listMissing(): Observable<{ data: Episode[]; total: number }> {
    return this.http.get<{ data: Episode[]; total: number }>(`${this.certUrl}/missing`);
  }
}
