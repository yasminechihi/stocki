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
  
  magasins: any[] = [];
  currentUser: any = null;
  isLoading = true;

  // Variables pour gérer les popups
  showEditPopup: boolean = false;
  showDeletePopup: boolean = false;
  selectedMagasin: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadMagasins();
  }

  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('Utilisateur connecté:', this.currentUser);
  }

  loadMagasins(): void {
    this.isLoading = true;
    this.authService.getMagasins().subscribe({
      next: (magasins) => {
        console.log('Magasins chargés:', magasins);
        this.magasins = magasins;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement magasins:', error);
        this.isLoading = false;
        // Données par défaut si erreur
        this.magasins = this.getDefaultMagasins();
      }
    });
  }

  private getDefaultMagasins(): any[] {
    return [
      { 
        nom: 'Decathlon Tunis City', 
        code: '000354865', 
        type: 'Interne', 
        adresse: 'Cebelat Ammar 2032 Ariana' 
      },
      { 
        nom: 'Decathlon La Marsa', 
        code: '000748956', 
        type: 'Interne', 
        adresse: 'direction, GP9, Tunis' 
      },
      { 
        nom: 'Decathlon Mall Of Sousse', 
        code: '000426789', 
        type: 'Interne', 
        adresse: 'Mall Of Sousse RN1, Tunis Km 128.' 
      }
    ];
  }

  editMagasin(magasin: any) {
    this.selectedMagasin = { ...magasin }; // Copie du magasin
    this.showEditPopup = true;
  }

  deleteMagasin(magasin: any) {
    this.selectedMagasin = magasin;
    this.showDeletePopup = true;
  }

  async confirmEdit() {
    if (!this.selectedMagasin) return;

    try {
      if (this.selectedMagasin.id === 0) {
        // MODE AJOUT
        this.authService.addMagasin({
          nom: this.selectedMagasin.nom,
          code: this.selectedMagasin.code,
          type: this.selectedMagasin.type,
          adresse: this.selectedMagasin.adresse
          // Supprimé: image: this.selectedMagasin.image
        }).subscribe({
          next: (newMagasin) => {
            console.log('✅ Magasin ajouté:', newMagasin);
            this.magasins.push(newMagasin);
            this.closePopups();
            this.loadMagasins(); // Recharger pour s'assurer d'avoir les données fraîches
          },
          error: (error) => {
            console.error('❌ Erreur ajout magasin:', error);
            alert('Erreur lors de l\'ajout du magasin: ' + (error.error?.message || 'Erreur serveur'));
          }
        });
      } else {
        // MODE ÉDITION
        this.authService.updateMagasin(this.selectedMagasin.id, {
          nom: this.selectedMagasin.nom,
          code: this.selectedMagasin.code,
          type: this.selectedMagasin.type,
          adresse: this.selectedMagasin.adresse
          // Supprimé: image: this.selectedMagasin.image
        }).subscribe({
          next: (updatedMagasin) => {
            console.log('✅ Magasin modifié:', updatedMagasin);
            // Mettre à jour localement le magasin existant
            const index = this.magasins.findIndex(m => m.id === this.selectedMagasin.id);
            if (index !== -1) {
              this.magasins[index] = { ...updatedMagasin };
            }
            this.closePopups();
          },
          error: (error) => {
            console.error('❌ Erreur modification magasin:', error);
            alert('Erreur lors de la modification du magasin: ' + (error.error?.message || 'Erreur serveur'));
          }
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  }

  async confirmDelete() {
    if (!this.selectedMagasin) return;

    try {
      this.authService.deleteMagasin(this.selectedMagasin.id).subscribe({
        next: () => {
          console.log('✅ Magasin supprimé avec succès');
          // Supprimer de la liste locale
          this.magasins = this.magasins.filter(m => m.id !== this.selectedMagasin.id);
          this.closePopups();
        },
        error: (error) => {
          console.error('❌ Erreur suppression magasin:', error);
          alert('Erreur lors de la suppression du magasin: ' + (error.error?.message || 'Erreur serveur'));
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
    this.selectedMagasin = null;
  }

  // Mettre à jour les valeurs du formulaire d'édition
  updateMagasinField(field: string, value: string) {
    if (this.selectedMagasin) {
      this.selectedMagasin[field] = value;
    }
  }

  addMagasin() {
    // Ouvrir un popup pour ajouter un nouveau magasin
    this.selectedMagasin = { 
      id: 0, // 0 indique un nouveau magasin
      nom: '', 
      code: '', 
      type: 'Interne',
      adresse: ''
      // Supprimé: image: 'assets/decathlon.png'
    };
    this.showEditPopup = true;
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}