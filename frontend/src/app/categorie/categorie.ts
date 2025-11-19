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

  ngOnInit(): void {
    this.loadUserData();
    this.loadCategories();
  }

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
  }

  deleteCategory(id: number) {
    alert("Supprimer catégorie ID : " + id);
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}