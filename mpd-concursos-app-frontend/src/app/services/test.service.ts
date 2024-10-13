import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TestService {

  private backendUrl = 'http://localhost:8080/api/test'; // URL de tu backend en Spring Boot

  constructor(private http: HttpClient) { }

  getTestMessage(): Observable<any> {
    return this.http.get(this.backendUrl, { responseType: 'json' });
  }
}
