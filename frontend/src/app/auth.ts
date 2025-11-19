import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
  requiresVerification?: boolean;
  requires2FA?: boolean;
  userId?: string;
  debugCode?: string;
}

export interface ContactResponse {
  message: string;
  contactId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials);
  }

  verifyLogin(verificationData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-login`, verificationData)
      .pipe(tap(response => {
        if (response.token && response.user) {
          this.setSession(response);
        }
      }));
  }

  verifyAccount(verificationData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-account`, verificationData);
  }

  resendVerification(userId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/resend-verification`, { userId });
  }

  resend2FA(userId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/resend-2fa`, { userId });
  }

  // MÉTHODE POUR LE CONTACT
  contact(contactData: any): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.apiUrl}/contact`, contactData);
  }

  // NOUVELLES MÉTHODES POUR LES DONNÉES UTILISATEUR
  getMagasins(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/magasins`, { headers });
  }

  getCategories(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/categories`, { headers });
  }

  getProduits(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/produits`, { headers });
  }

  addMagasin(magasinData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/magasins`, magasinData, { headers });
  }

  addCategorie(categorieData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/categories`, categorieData, { headers });
  }

  addProduit(produitData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/produits`, produitData, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private setSession(authResult: AuthResponse): void {
    if (authResult.token && authResult.user) {
      localStorage.setItem('token', authResult.token);
      localStorage.setItem('user', JSON.stringify(authResult.user));
      this.currentUserSubject.next(authResult.user);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private loadUserFromStorage(): void {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}