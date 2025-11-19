import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-categorie',
  templateUrl: './categorie.html',
  styleUrls: ['./categorie.css'],
  imports: [CommonModule, RouterModule],
})
export class Categorie implements OnInit {

  categories: Array<{ 
    id: number, 
    nom: string, 
    code: string, 
    description: string 
  }> = [];

  ngOnInit(): void {
    this.loadCategories();
  }

  async loadCategories() {
  try {
    console.log('🔄 Début du chargement des catégories...');
    
    // CHANGEMENT ICI : Port 3001 au lieu de 3000
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

  editCategory(id: number) {
    alert("Modifier catégorie ID : " + id);
  }

  deleteCategory(id: number) {
    alert("Supprimer catégorie ID : " + id);
  }
}
