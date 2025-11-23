import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth';

@Component({
  standalone: true,
  selector: 'app-mouvements',
  templateUrl: './mouvements.html',
  styleUrls: ['./mouvements.css'],
  imports: [CommonModule, RouterModule],
})
export class Mouvements implements OnInit {

  mouvements: any[] = [];
  produits: any[] = [];
  magasins: any[] = [];
  categories: any[] = [];
  currentUser: any = null;
  isLoading = true;

  showEditPopup: boolean = false;
  showDeletePopup: boolean = false;
  selectedMouvement: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadMouvements();
    this.loadReferences();
  }

  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      console.error('Aucun utilisateur connecté');
    }
  }

  loadMouvements() {
    this.isLoading = true;
    try {
      this.authService.getMouvements().subscribe({
        next: (mouvements) => {
          console.log('Mouvements chargés:', mouvements);
          this.mouvements = mouvements;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement mouvements:', error);
          this.isLoading = false;
          this.loadMouvementsLegacy();
        }
      });
    } catch (error) {
      console.error("Erreur lors du chargement :", error);
      this.isLoading = false;
    }
  }

  private async loadMouvementsLegacy() {
    try {
      console.log('🔄 Début du chargement des mouvements (legacy)...');
      
      const response = await fetch("http://localhost:3001/mouvements-stock");
      
      console.log('📡 Statut de la réponse:', response.status);
      
      if (!response.ok) {
        throw new Error("Erreur HTTP : " + response.status);
      }

      const data = await response.json();
      console.log('📦 Données reçues:', data);
      
      this.mouvements = data;
      console.log('✅ Mouvements chargés:', this.mouvements.length);
      
    } catch (error) {
      console.error("❌ Erreur lors du chargement :", error);
    }
  }

  loadReferences() {
    // Charger les produits
    this.authService.getProduits().subscribe({
      next: (produits) => {
        this.produits = produits;
      },
      error: (error) => {
        console.error('Erreur chargement produits:', error);
      }
    });

    // Charger les magasins
    this.authService.getMagasins().subscribe({
      next: (magasins) => {
        this.magasins = magasins;
      },
      error: (error) => {
        console.error('Erreur chargement magasins:', error);
      }
    });

    // Charger les catégories
    this.authService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Erreur chargement catégories:', error);
      }
    });
  }

  // Méthodes de statistiques
  getTotalMouvements(): number {
    return this.mouvements.length;
  }

  getTotalEntrees(): number {
    return this.mouvements.filter(m => m.type_mouvement === 'entree').length;
  }

  getTotalSorties(): number {
    return this.mouvements.filter(m => m.type_mouvement === 'sortie').length;
  }

  getValeurTotale(): string {
    const total = this.mouvements.reduce((sum, m) => {
      return sum + (m.quantite * m.prix_unitaire);
    }, 0);
    return total.toFixed(2);
  }

  editMouvement(mouvement: any) {
    this.selectedMouvement = { ...mouvement };
    this.showEditPopup = true;
  }

  deleteMouvement(mouvement: any) {
    this.selectedMouvement = mouvement;
    this.showDeletePopup = true;
  }

  async confirmEdit() {
    if (!this.selectedMouvement) return;

    try {
      if (this.selectedMouvement.id === 0) {
        this.authService.addMouvement({
          produit_id: this.selectedMouvement.produit_id,
          magasin_id: this.selectedMouvement.magasin_id,
          categorie_id: this.selectedMouvement.categorie_id,
          type_mouvement: this.selectedMouvement.type_mouvement,
          quantite: this.selectedMouvement.quantite,
          prix_unitaire: this.selectedMouvement.prix_unitaire,
          date_mouvement: this.selectedMouvement.date_mouvement,
          motif: this.selectedMouvement.motif
        }).subscribe({
          next: (newMouvement) => {
            console.log('✅ Mouvement ajouté:', newMouvement);
            this.mouvements.push(newMouvement);
            this.closePopups();
            this.loadMouvements();
          },
          error: (error) => {
            console.error('❌ Erreur ajout mouvement:', error);
            alert('Erreur lors de l\'ajout du mouvement: ' + (error.error?.message || 'Erreur serveur'));
          }
        });
      } else {
        this.authService.updateMouvement(this.selectedMouvement.id, {
          produit_id: this.selectedMouvement.produit_id,
          magasin_id: this.selectedMouvement.magasin_id,
          categorie_id: this.selectedMouvement.categorie_id,
          type_mouvement: this.selectedMouvement.type_mouvement,
          quantite: this.selectedMouvement.quantite,
          prix_unitaire: this.selectedMouvement.prix_unitaire,
          date_mouvement: this.selectedMouvement.date_mouvement,
          motif: this.selectedMouvement.motif
        }).subscribe({
          next: (updatedMouvement) => {
            console.log('✅ Mouvement modifié:', updatedMouvement);
            const index = this.mouvements.findIndex(m => m.id === this.selectedMouvement.id);
            if (index !== -1) {
              this.mouvements[index] = { ...updatedMouvement };
            }
            this.closePopups();
          },
          error: (error) => {
            console.error('❌ Erreur modification mouvement:', error);
            alert('Erreur lors de la modification du mouvement: ' + (error.error?.message || 'Erreur serveur'));
          }
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  }

  async confirmDelete() {
    if (!this.selectedMouvement) return;

    try {
      this.authService.deleteMouvement(this.selectedMouvement.id).subscribe({
        next: () => {
          console.log('✅ Mouvement supprimé avec succès');
          this.mouvements = this.mouvements.filter(m => m.id !== this.selectedMouvement.id);
          this.closePopups();
        },
        error: (error) => {
          console.error('❌ Erreur suppression mouvement:', error);
          alert('Erreur lors de la suppression du mouvement: ' + (error.error?.message || 'Erreur serveur'));
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
    this.selectedMouvement = null;
  }

  updateMouvementField(field: string, value: string) {
    if (this.selectedMouvement) {
      this.selectedMouvement[field] = value;
    }
  }

  addMouvement() {
    this.selectedMouvement = { 
      id: 0,
      produit_id: '',
      magasin_id: '',
      categorie_id: '',
      type_mouvement: 'entree',
      quantite: 1,
      prix_unitaire: 0,
      date_mouvement: new Date().toISOString().split('T')[0],
      motif: ''
    };
    this.showEditPopup = true;
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}