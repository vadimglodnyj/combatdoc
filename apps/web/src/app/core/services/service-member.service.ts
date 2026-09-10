import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ServiceMember,
  ServiceMemberPage,
  CreateServiceMemberDto,
  ImportPreview,
} from '../models/service-member.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ServiceMemberService {
  private apiUrl = `${environment.apiUrl}/service-members`;

  constructor(private http: HttpClient) {}

  getAll(search?: string, page = 1, take = 30): Observable<ServiceMemberPage> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('take', String(take));
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<ServiceMemberPage>(this.apiUrl, { params });
  }

  getOne(id: string): Observable<ServiceMember> {
    return this.http.get<ServiceMember>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateServiceMemberDto): Observable<ServiceMember> {
    return this.http.post<ServiceMember>(this.apiUrl, dto);
  }

  update(id: string, dto: Partial<CreateServiceMemberDto>): Observable<ServiceMember> {
    return this.http.put<ServiceMember>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<{ success: boolean; id: string }> {
    return this.http.delete<{ success: boolean; id: string }>(`${this.apiUrl}/${id}`);
  }

  importPreview(file: File): Observable<ImportPreview> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportPreview>(`${this.apiUrl}/import/preview`, formData);
  }

  importApply(rows: number[], overwriteExisting: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/import/apply`, { rows, overwriteExisting });
  }
}
