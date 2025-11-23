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
  success?: boolean;
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

  contact(contactData: any): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.apiUrl}/contact`, contactData);
  }

  // === DASHBOARD ===
  getDashboardStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/dashboard/stats`, { headers });
  }

  // === MAGASINS ===
  getMagasins(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/magasins`, { headers });
  }

  addMagasin(magasinData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    const { image, ...dataWithoutImage } = magasinData;
    return this.http.post(`${this.apiUrl}/magasins`, dataWithoutImage, { headers });
  }

  updateMagasin(id: number, magasinData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    const { image, ...dataWithoutImage } = magasinData;
    return this.http.put(`${this.apiUrl}/magasins/${id}`, dataWithoutImage, { headers });
  }

  deleteMagasin(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/magasins/${id}`, { headers });
  }

  // === CATÉGORIES ===
  getCategories(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/categories`, { headers });
  }

  addCategorie(categorieData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/categories`, categorieData, { headers });
  }

  updateCategorie(id: number, categorieData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/categories/${id}`, categorieData, { headers });
  }

  deleteCategorie(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/categories/${id}`, { headers });
  }

  // === PRODUITS ===
  getProduits(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/produits`, { headers });
  }

  addProduit(produitData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    const { image, ...dataWithoutImage } = produitData;
    return this.http.post(`${this.apiUrl}/produits`, dataWithoutImage, { headers });
  }

  updateProduit(id: number, produitData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    const { image, ...dataWithoutImage } = produitData;
    return this.http.put(`${this.apiUrl}/produits/${id}`, dataWithoutImage, { headers });
  }

  deleteProduit(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/produits/${id}`, { headers });
  }

  // === MOUVEMENTS STOCK ===
  getMouvements(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/mouvements`, { headers });
  }

  addMouvement(mouvementData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/mouvements`, mouvementData, { headers });
  }

  updateMouvement(id: number, mouvementData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/mouvements/${id}`, mouvementData, { headers });
  }

  deleteMouvement(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/mouvements/${id}`, { headers });
  }

  // === STOCK ACTUEL ===
  getStockActuel(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/stock`, { headers });
  }

  // === VENTES ===
  getVentesStats(filters?: any): Observable<any> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/ventes/stats`;
    if (filters) {
      const params = new URLSearchParams(filters).toString();
      url += `?${params}`;
    }
    return this.http.get(url, { headers });
  }

  getTopProduits(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/ventes/top-produits`, { headers });
  }

  getEvolutionCA(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/ventes/evolution-ca`, { headers });
  }

  getVentesParCategorie(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/ventes/par-categorie`, { headers });
  }

  getVentesRecentes(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/ventes/recentes`, { headers });
  }

  // === MÉTHODES PRIVÉES ===
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
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