import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'   
})
export class AuthService {
  private apiUrl = 'http://localhost:3001';  // Changé de 8000 à 3001
  
  constructor(private http: HttpClient) {}

  // Méthode pour le formulaire de contact
  contact(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/contact`, data);
  }

  // Inscription
  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/register`, data);
  }

  // Connexion
  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/login`, data);
  }

  // Vérification 2FA
  verifyLogin(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/verify-login`, data);
  }

  // Vérification de compte
  verifyAccount(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/verify-account`, data);
  }

  // Renvoyer code 2FA
  resend2FA(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/resend-2fa`, { userId });
  }

  // Renvoyer code de vérification
  resendVerification(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/resend-verification`, { userId });
  }
}