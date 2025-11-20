import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth';

@Component({
  standalone: true,
  selector: 'app-categorie',
  templateUrl: './categorie.html',
  styleUrls: ['./categorie.css'],
  imports: [CommonModule, RouterModule],
})
export class Categorie implements OnInit {

  categories: any[] = [];
  currentUser: any = null;
  isLoading = true;

  constructor(private authService: AuthService) {}

  // Variables pour gérer les popups
  showEditPopup: boolean = false;
  showDeletePopup: boolean = false;
  selectedCategory: any = null;

  ngOnInit(): void {
    this.loadUserData();
    this.loadCategories();
  }

  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      console.error('Aucun utilisateur connecté');
      // Rediriger vers la page de connexion si nécessaire
    }
  }

  loadCategories() {
    this.isLoading = true;
    try {
      this.authService.getCategories().subscribe({
        next: (categories) => {
          console.log('Catégories chargées:', categories);
          this.categories = categories;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement catégories:', error);
          this.isLoading = false;
          // Chargement depuis l'API legacy en cas d'erreur
          this.loadCategoriesLegacy();
        }
      });
    } catch (error) {
      console.error("Erreur lors du chargement :", error);
      this.isLoading = false;
    }
  }

  private async loadCategoriesLegacy() {
    try {
      console.log('🔄 Début du chargement des catégories (legacy)...');
      
      const response = await fetch("http://localhost:3001/categories");
      
      console.log('📡 Statut de la réponse:', response.status);
      
      if (!response.ok) {
        throw new Error("Erreur HTTP : " + response.status);
      }

      const data = await response.json();
      console.log('📦 Données reçues:', data);
      
      this.categories = data;
      console.log('✅ Catégories chargées:', this.categories.length);
      
    } catch (error) {
      console.error("❌ Erreur lors du chargement :", error);
    }
  }

  editCategory(category: any) {
    this.selectedCategory = { ...category }; // Copie de la catégorie
    this.showEditPopup = true;
  }

  deleteCategory(category: any) {
    this.selectedCategory = category;
    this.showDeletePopup = true;
  }

  async confirmEdit() {
    if (!this.selectedCategory) return;

    try {
      if (this.selectedCategory.id === 0) {
        // MODE AJOUT
        this.authService.addCategorie({
          nom: this.selectedCategory.nom,
          code: this.selectedCategory.code,
          description: this.selectedCategory.description
        }).subscribe({
          next: (newCategory) => {
            console.log('✅ Catégorie ajoutée:', newCategory);
            this.categories.push(newCategory);
            this.closePopups();
            this.loadCategories(); // Recharger pour s'assurer d'avoir les données fraîches
          },
          error: (error) => {
            console.error('❌ Erreur ajout catégorie:', error);
            alert('Erreur lors de l\'ajout de la catégorie: ' + (error.error?.message || 'Erreur serveur'));
          }
        });
      } else {
        // MODE ÉDITION
        this.authService.updateCategorie(this.selectedCategory.id, {
          nom: this.selectedCategory.nom,
          code: this.selectedCategory.code,
          description: this.selectedCategory.description
        }).subscribe({
          next: (updatedCategory) => {
            console.log('✅ Catégorie modifiée:', updatedCategory);
            // Mettre à jour localement la catégorie existante
            const index = this.categories.findIndex(c => c.id === this.selectedCategory.id);
            if (index !== -1) {
              this.categories[index] = { ...updatedCategory };
            }
            this.closePopups();
          },
          error: (error) => {
            console.error('❌ Erreur modification catégorie:', error);
            alert('Erreur lors de la modification de la catégorie: ' + (error.error?.message || 'Erreur serveur'));
          }
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  }

  async confirmDelete() {
    if (!this.selectedCategory) return;

    try {
      this.authService.deleteCategorie(this.selectedCategory.id).subscribe({
        next: () => {
          console.log('✅ Catégorie supprimée avec succès');
          // Supprimer de la liste locale
          this.categories = this.categories.filter(c => c.id !== this.selectedCategory.id);
          this.closePopups();
        },
        error: (error) => {
          console.error('❌ Erreur suppression catégorie:', error);
          alert('Erreur lors de la suppression de la catégorie: ' + (error.error?.message || 'Erreur serveur'));
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
    this.selectedCategory = null;
  }

  // Mettre à jour les valeurs du formulaire d'édition
  updateCategoryField(field: string, value: string) {
    if (this.selectedCategory) {
      this.selectedCategory[field] = value;
    }
  }

  addCategory() {
    // Ouvrir un popup pour ajouter une nouvelle catégorie
    this.selectedCategory = { 
      id: 0, // 0 indique une nouvelle catégorie
      nom: '', 
      code: '', 
      description: '' 
    };
    this.showEditPopup = true;
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}