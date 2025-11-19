import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth';

@Component({
  standalone: true,
  selector: 'app-magasin',
  templateUrl: './magasin.html',
  styleUrls: ['./magasin.css'],
  imports: [CommonModule, RouterModule],
})
export class Magasin implements OnInit {
  
  produits: any[] = [];
  currentUser: any = null;
  isLoading = true;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadProduits();
  }

  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('Utilisateur connecté:', this.currentUser);
  }

  loadProduits(): void {
    this.isLoading = true;
    this.authService.getProduits().subscribe({
      next: (produits) => {
        console.log('Produits chargés:', produits);
        this.produits = produits;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement produits:', error);
        this.isLoading = false;
        // Données par défaut si erreur
        this.produits = this.getDefaultProduits();
      }
    });
  }

  private getDefaultProduits(): any[] {
    return [
      { 
        image: 'assets/decathlon.png', 
        nom: 'Decathlon Tunis City', 
        code: '000354865', 
        type: 'Interne', 
        adresse: 'Cebelat Ammar 2032 Ariana' 
      },
      { 
        image: 'assets/decathlon.png', 
        nom: 'Decathlon La Marsa', 
        code: '000748956', 
        type: 'Interne', 
        adresse: 'direction, GP9, Tunis' 
      },
      { 
        image: 'assets/decathlon.png', 
        nom: 'Decathlon Mall Of Sousse', 
        code: '000426789', 
        type: 'Interne', 
        adresse: 'Mall Of Sousse RN1, Tunis Km 128.' 
      }
    ];
  }

  logout(): void {
    this.authService.logout();
    // Redirection vers la page d'accueil après déconnexion
    window.location.href = '/';
  }
}