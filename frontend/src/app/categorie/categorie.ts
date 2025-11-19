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

<<<<<<< HEAD
  async loadCategories() {
    try {
      console.log('🔄 Début du chargement des catégories...');
      
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
=======
  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  async loadCategories() {
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
      const response = await fetch("http://localhost:3001/categories");
      if (response.ok) {
        const data = await response.json();
        this.categories = data;
      }
    } catch (error) {
      console.error("Erreur chargement legacy:", error);
    }
  }

  editCategory(id: number) {
    alert("Modifier catégorie ID : " + id);
>>>>>>> 5dcd4028831af8dd9b82a9642f57b6b34ff1eb62
  }

  editCategory(category: any) {
    this.selectedCategory = { ...category }; // Copie de la catégorie
    this.showEditPopup = true;
  }

<<<<<<< HEAD
  deleteCategory(category: any) {
    this.selectedCategory = category;
    this.showDeletePopup = true;
  }

  async confirmEdit() {
    if (!this.selectedCategory) return;

    try {
      let response: Response;
      
      if (this.selectedCategory.id === 0) {
        // MODE AJOUT - Requête POST
        response = await fetch("http://localhost:3001/categories", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nom: this.selectedCategory.nom,
            code: this.selectedCategory.code,
            description: this.selectedCategory.description
          })
        });
      } else {
        // MODE ÉDITION - Requête PUT
        response = await fetch(`http://localhost:3001/categories/${this.selectedCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.selectedCategory)
        });
      }

      if (response.ok) {
        const updatedCategory = await response.json();
        
        if (this.selectedCategory.id === 0) {
          // Ajouter la nouvelle catégorie à la liste
          this.categories.push(updatedCategory);
        } else {
          // Mettre à jour localement la catégorie existante
          const index = this.categories.findIndex(c => c.id === this.selectedCategory.id);
          if (index !== -1) {
            this.categories[index] = { ...updatedCategory };
          }
        }
        
        this.closePopups();
        console.log('✅ Catégorie sauvegardée avec succès');
      } else {
        const errorData = await response.json();
        alert('Erreur: ' + (errorData.error || 'Erreur lors de la sauvegarde'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  }

  async confirmDelete() {
    if (!this.selectedCategory) return;

    try {
      const response = await fetch(`http://localhost:3001/categories/${this.selectedCategory.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Supprimer de la liste locale
        this.categories = this.categories.filter(c => c.id !== this.selectedCategory.id);
        this.closePopups();
        console.log('✅ Catégorie supprimée avec succès');
      } else {
        const errorData = await response.json();
        alert('Erreur: ' + (errorData.error || 'Erreur lors de la suppression'));
      }
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
=======
  logout(): void {
    this.authService.logout();
    window.location.href = '/';
>>>>>>> 5dcd4028831af8dd9b82a9642f57b6b34ff1eb62
  }
}