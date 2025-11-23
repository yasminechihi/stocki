import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth';

@Component({
  standalone: true,
  selector: 'app-stock',
  templateUrl: './stock.html',
  styleUrls: ['./stock.css'],
  imports: [CommonModule, RouterModule, FormsModule],
})
export class Stock implements OnInit {

  stock: any[] = [];
  currentUser: any = null;
  isLoading = true;
  
  // Pour les popups
  showEditPopup: boolean = false;
  showDeletePopup: boolean = false;
  showAjustementPopup: boolean = false;
  selectedStock: any = null;

  // Filtres
  filtreMagasin: string = '';
  filtreCategorie: string = '';
  filtreProduit: string = '';

  // Statistiques
  statsStock = {
    totalProduits: 0,
    valeurTotale: 0,
    produitsFaibleStock: 0,
    produitsRupture: 0
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadStock();
  }

  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  loadStock(): void {
    this.isLoading = true;
    
    this.authService.getStockActuel().subscribe({
      next: (stockData) => {
        this.stock = stockData;
        this.calculerStatsStock();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement stock:', error);
        this.isLoading = false;
        // Données de secours
        this.stock = this.getDefaultStock();
        this.calculerStatsStock();
      }
    });
  }

  calculerStatsStock(): void {
    this.statsStock = {
      totalProduits: this.stock.length,
      valeurTotale: this.stock.reduce((sum, s) => sum + (s.valeur_stock || 0), 0),
      produitsFaibleStock: this.stock.filter(s => s.quantite > 0 && s.quantite <= 10).length,
      produitsRupture: this.stock.filter(s => s.quantite === 0).length
    };
  }

  // Données par défaut en cas d'erreur
  private getDefaultStock(): any[] {
    return [
      { 
        id: 1,
        produit_nom: 'Ballon Football',
        produit_code: 'BLN001',
        produit_type: 'Vente',
        categorie_nom: 'Sport',
        magasin_nom: 'Decathlon Tunis City',
        quantite: 25,
        valeur_stock: 637.50
      },
      { 
        id: 2,
        produit_nom: 'Raquette Tennis',
        produit_code: 'RQT002',
        produit_type: 'Vente',
        categorie_nom: 'Sport',
        magasin_nom: 'Decathlon La Marsa',
        quantite: 15,
        valeur_stock: 900.00
      },
      { 
        id: 3,
        produit_nom: 'T-shirt Sport',
        produit_code: 'TST003',
        produit_type: 'Vente',
        categorie_nom: 'Vêtements',
        magasin_nom: 'Decathlon Tunis City',
        quantite: 8,
        valeur_stock: 180.00
      },
      { 
        id: 4,
        produit_nom: 'Chaussures Running',
        produit_code: 'CHR004',
        produit_type: 'Vente',
        categorie_nom: 'Chaussures',
        magasin_nom: 'Decathlon Mall Of Sousse',
        quantite: 0,
        valeur_stock: 0
      },
      { 
        id: 5,
        produit_nom: 'Sac à Dos',
        produit_code: 'SAC005',
        produit_type: 'Interne',
        categorie_nom: 'Accessoires',
        magasin_nom: 'Decathlon Tunis City',
        quantite: 12,
        valeur_stock: 360.00
      }
    ];
  }

  // Actions
  ajusterStock(stock: any): void {
    this.selectedStock = { ...stock };
    this.showAjustementPopup = true;
  }

  editStock(stock: any): void {
    this.selectedStock = { ...stock };
    this.showEditPopup = true;
  }

  deleteStock(stock: any): void {
    this.selectedStock = stock;
    this.showDeletePopup = true;
  }

  async confirmAjustement(): Promise<void> {
    if (!this.selectedStock) return;

    try {
      // Préparer les données pour l'ajustement
      const ajustementData = {
        produit_id: this.selectedStock.produit_id,
        magasin_id: this.selectedStock.magasin_id,
        categorie_id: this.selectedStock.categorie_id,
        type_mouvement: 'ajustement',
        quantite: this.selectedStock.nouvelleQuantite - this.selectedStock.quantite,
        prix_unitaire: this.selectedStock.valeur_stock / this.selectedStock.quantite || 0,
        date_mouvement: new Date().toISOString().slice(0, 10),
        motif: `Ajustement stock - ${this.selectedStock.nouvelleQuantite} unités`
      };

      this.authService.addMouvement(ajustementData).subscribe({
        next: (mouvement) => {
          console.log('✅ Stock ajusté:', mouvement);
          this.loadStock(); // Recharger le stock
          this.closePopups();
        },
        error: (error) => {
          console.error('❌ Erreur ajustement stock:', error);
          alert('Erreur lors de l\'ajustement du stock: ' + (error.error?.message || 'Erreur serveur'));
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  }

  async confirmEdit(): Promise<void> {
    if (!this.selectedStock) return;

    try {
      // Ici vous pouvez implémenter la modification si nécessaire
      // Pour l'instant on recharge juste les données
      this.loadStock();
      this.closePopups();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  }

  async confirmDelete(): Promise<void> {
    if (!this.selectedStock) return;

    try {
      // Pour supprimer un produit du stock, on peut mettre la quantité à 0 via un ajustement
      const ajustementData = {
        produit_id: this.selectedStock.produit_id,
        magasin_id: this.selectedStock.magasin_id,
        categorie_id: this.selectedStock.categorie_id,
        type_mouvement: 'ajustement',
        quantite: -this.selectedStock.quantite, // Mettre à 0
        prix_unitaire: this.selectedStock.valeur_stock / this.selectedStock.quantite || 0,
        date_mouvement: new Date().toISOString().slice(0, 10),
        motif: 'Suppression du stock'
      };

      this.authService.addMouvement(ajustementData).subscribe({
        next: (mouvement) => {
          console.log('✅ Stock supprimé:', mouvement);
          this.loadStock(); // Recharger le stock
          this.closePopups();
        },
        error: (error) => {
          console.error('❌ Erreur suppression stock:', error);
          alert('Erreur lors de la suppression du stock: ' + (error.error?.message || 'Erreur serveur'));
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  }

  closePopups(): void {
    this.showEditPopup = false;
    this.showDeletePopup = false;
    this.showAjustementPopup = false;
    this.selectedStock = null;
  }

  updateStockField(field: string, value: any): void {
    if (this.selectedStock) {
      this.selectedStock[field] = value;
    }
  }

  // Filtres
  appliquerFiltres(): void {
    console.log('Filtres appliqués:', this.filtreMagasin, this.filtreCategorie, this.filtreProduit);
    // Les filtres seront appliqués dans le HTML via pipe ou directement dans le tableau
  }

  reinitialiserFiltres(): void {
    this.filtreMagasin = '';
    this.filtreCategorie = '';
    this.filtreProduit = '';
  }

  // Méthodes utilitaires
  getNiveauStockClass(quantite: number): string {
    if (quantite === 0) return 'niveau-rupture';
    if (quantite <= 5) return 'niveau-faible';
    if (quantite <= 15) return 'niveau-moyen';
    return 'niveau-bon';
  }

  getNiveauStockText(quantite: number): string {
    if (quantite === 0) return 'Rupture';
    if (quantite <= 5) return 'Faible';
    if (quantite <= 15) return 'Moyen';
    return 'Bon';
  }

  getProduitsFiltres(): any[] {
    let produitsFiltres = this.stock;

    if (this.filtreMagasin) {
      produitsFiltres = produitsFiltres.filter(p => 
        p.magasin_nom.toLowerCase().includes(this.filtreMagasin.toLowerCase())
      );
    }

    if (this.filtreCategorie) {
      produitsFiltres = produitsFiltres.filter(p => 
        p.categorie_nom.toLowerCase().includes(this.filtreCategorie.toLowerCase())
      );
    }

    if (this.filtreProduit) {
      produitsFiltres = produitsFiltres.filter(p => 
        p.produit_nom.toLowerCase().includes(this.filtreProduit.toLowerCase()) ||
        p.produit_code.toLowerCase().includes(this.filtreProduit.toLowerCase())
      );
    }

    return produitsFiltres;
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}