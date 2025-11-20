import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth';

@Component({
  standalone: true,
  selector: 'app-produit',
  templateUrl: './produit.html',
  styleUrls: ['./produit.css'],
  imports: [CommonModule, RouterModule],
})
export class Produit implements OnInit {

  produits: any[] = [];
  currentUser: any = null;
  isLoading = true;

  // Variables pour gérer les popups
  showEditPopup: boolean = false;
  showDeletePopup: boolean = false;
  selectedProduit: any = null;

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
        nom: 'Fitness & Gymnastique', 
        code: '123789555', 
        type: 'Vente', 
        prix: 25.50,
        adresse: 'Entrepôt principal - Zone A'
      },
      { 
        nom: 'Marche & Course', 
        code: '123789556', 
        type: 'Vente', 
        prix: 35.75,
        adresse: 'Entrepôt secondaire - Rayon 2'
      },
      { 
        nom: 'Bagagerie', 
        code: '000354865', 
        type: 'Interne', 
        prix: 0,
        adresse: 'Cebelat Ammar 2032 Ariana' 
      }
    ];
  }

  editProduit(produit: any) {
    this.selectedProduit = { ...produit }; // Copie du produit
    this.showEditPopup = true;
  }

  deleteProduit(produit: any) {
    this.selectedProduit = produit;
    this.showDeletePopup = true;
  }

  async confirmEdit() {
    if (!this.selectedProduit) return;

    try {
      if (this.selectedProduit.id === 0) {
        // MODE AJOUT
        this.authService.addProduit({
          nom: this.selectedProduit.nom,
          code: this.selectedProduit.code,
          type: this.selectedProduit.type,
          prix: this.selectedProduit.prix,
          adresse: this.selectedProduit.adresse
        }).subscribe({
          next: (newProduit) => {
            console.log('✅ Produit ajouté:', newProduit);
            this.produits.push(newProduit);
            this.closePopups();
            this.loadProduits(); // Recharger pour s'assurer d'avoir les données fraîches
          },
          error: (error) => {
            console.error('❌ Erreur ajout produit:', error);
            alert('Erreur lors de l\'ajout du produit: ' + (error.error?.message || 'Erreur serveur'));
          }
        });
      } else {
        // MODE ÉDITION
        this.authService.updateProduit(this.selectedProduit.id, {
          nom: this.selectedProduit.nom,
          code: this.selectedProduit.code,
          type: this.selectedProduit.type,
          prix: this.selectedProduit.prix,
          adresse: this.selectedProduit.adresse
        }).subscribe({
          next: (updatedProduit) => {
            console.log('✅ Produit modifié:', updatedProduit);
            // Mettre à jour localement le produit existant
            const index = this.produits.findIndex(p => p.id === this.selectedProduit.id);
            if (index !== -1) {
              this.produits[index] = { ...updatedProduit };
            }
            this.closePopups();
          },
          error: (error) => {
            console.error('❌ Erreur modification produit:', error);
            alert('Erreur lors de la modification du produit: ' + (error.error?.message || 'Erreur serveur'));
          }
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  }

  async confirmDelete() {
    if (!this.selectedProduit) return;

    try {
      this.authService.deleteProduit(this.selectedProduit.id).subscribe({
        next: () => {
          console.log('✅ Produit supprimé avec succès');
          // Supprimer de la liste locale
          this.produits = this.produits.filter(p => p.id !== this.selectedProduit.id);
          this.closePopups();
        },
        error: (error) => {
          console.error('❌ Erreur suppression produit:', error);
          alert('Erreur lors de la suppression du produit: ' + (error.error?.message || 'Erreur serveur'));
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  }

  closePopups() {
    this.showEditPopup = false;
    this.showDeletePopup = false;
    this.selectedProduit = null;
  }

  // Mettre à jour les valeurs du formulaire d'édition
  updateProduitField(field: string, value: string) {
    if (this.selectedProduit) {
      this.selectedProduit[field] = value;
    }
  }

  addProduit() {
    // Ouvrir un popup pour ajouter un nouveau produit
    this.selectedProduit = { 
      id: 0, // 0 indique un nouveau produit
      nom: '', 
      code: '', 
      type: 'Vente',
      prix: 0,
      adresse: ''
    };
    this.showEditPopup = true;
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}