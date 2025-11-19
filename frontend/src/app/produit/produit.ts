import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth';

@Component({
  standalone: true,
  selector: 'app-Produit',
  templateUrl: './produit.html',
  styleUrls: ['./produit.css'],
  imports: [CommonModule, RouterModule],
})
export class Produit implements OnInit {

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
        image: 'assets/fitness.png', 
        nom: 'Fitness & Gymnastique', 
        code: '123789555', 
        type: 'Vente', 
        prix: 5 
      },
      { 
        image: 'assets/course.png', 
        nom: 'Marche & Course', 
        code: '123789555', 
        type: 'Vente', 
        prix: 5 
      },
      { 
        image: 'assets/bagage.png', 
        nom: 'Bagagerie', 
        code: '000354865', 
        type: 'Interne', 
        adresse: 'Cebelat Ammar 2032 Ariana' 
      }
    ];
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}