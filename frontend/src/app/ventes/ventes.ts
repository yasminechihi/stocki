import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth';

@Component({
  standalone: true,
  selector: 'app-ventes',
  templateUrl: './ventes.html',
  styleUrls: ['./ventes.css'],
  imports: [CommonModule, RouterModule, FormsModule],
})
export class Ventes implements OnInit {

  ventes: any[] = [];
  produits: any[] = [];
  currentUser: any = null;
  isLoading = true;
  
  // Pour les popups
  showEditPopup: boolean = false;
  showDeletePopup: boolean = false;
  selectedVente: any = null;

  // Statistiques
  statsVentes = {
    caTotal: 0,
    caAujourdhui: 0,
    caMois: 0,
    quantiteVendue: 0
  };

  // Filtres
  dateDebut: string = '';
  dateFin: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.setDefaultDates();
    this.loadProduits();
    this.loadVentes();
    this.loadStatsVentes();
  }

  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  setDefaultDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.dateDebut = firstDay.toISOString().split('T')[0];
    this.dateFin = today.toISOString().split('T')[0];
  }

  loadProduits(): void {
    this.authService.getProduits().subscribe({
      next: (produits) => {
        this.produits = produits;
      },
      error: (error) => {
        console.error('Erreur chargement produits:', error);
      }
    });
  }

  loadVentes(): void {
    this.isLoading = true;
    
    // Récupérer les mouvements de type "sortie" (ventes)
    this.authService.getMouvements().subscribe({
      next: (mouvements) => {
        // Filtrer seulement les ventes (sorties)
        this.ventes = mouvements
          .filter((m: any) => m.type_mouvement === 'sortie')
          .map((mouvement: any) => ({
            id: mouvement.id,
            produit: mouvement.produit_nom,
            code: mouvement.produit_code,
            client: mouvement.motif || 'Client',
            quantite: mouvement.quantite,
            prix: mouvement.prix_unitaire,
            total: mouvement.quantite * mouvement.prix_unitaire,
            date: mouvement.date_mouvement,
            statut: 'Complétée',
            produit_id: mouvement.produit_id,
            magasin_id: mouvement.magasin_id
          }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement ventes:', error);
        this.isLoading = false;
        // Données de secours avec prix en DT
        this.ventes = this.getDefaultVentes();
      }
    });
  }

  loadStatsVentes(): void {
    // Utiliser l'API des statistiques de ventes
    this.authService.getVentesStats({
      dateDebut: this.dateDebut,
      dateFin: this.dateFin
    }).subscribe({
      next: (stats) => {
        this.statsVentes = stats;
      },
      error: (error) => {
        console.error('Erreur chargement stats ventes:', error);
        // Calcul manuel basé sur les ventes chargées
        this.calculerStatsManuelles();
      }
    });
  }

  calculerStatsManuelles(): void {
    const aujourdhui = new Date().toISOString().split('T')[0];
    const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    this.statsVentes = {
      caTotal: this.ventes.reduce((sum, v) => sum + v.total, 0),
      caAujourdhui: this.ventes
        .filter(v => v.date.startsWith(aujourdhui))
        .reduce((sum, v) => sum + v.total, 0),
      caMois: this.ventes
        .filter(v => v.date >= debutMois)
        .reduce((sum, v) => sum + v.total, 0),
      quantiteVendue: this.ventes.reduce((sum, v) => sum + v.quantite, 0)
    };
  }

  // Données par défaut en cas d'erreur
  private getDefaultVentes(): any[] {
    return [
      { 
        id: 1, 
        produit: 'Ballon Football', 
        code: 'BLN001', 
        client: 'Client A', 
        quantite: 2, 
        prix: 25.50,
        total: 51.00,
        date: '2024-01-07',
        statut: 'Complétée',
        produit_id: 1,
        magasin_id: 1
      },
      { 
        id: 2, 
        produit: 'Raquette Tennis', 
        code: 'RQT002', 
        client: 'Client B', 
        quantite: 1, 
        prix: 60.00,
        total: 60.00,
        date: '2024-01-07',
        statut: 'Complétée',
        produit_id: 2,
        magasin_id: 1
      },
      { 
        id: 3, 
        produit: 'T-shirt Sport', 
        code: 'TST003', 
        client: 'Client C', 
        quantite: 3, 
        prix: 22.50,
        total: 67.50,
        date: '2024-01-06',
        statut: 'Complétée',
        produit_id: 3,
        magasin_id: 1
      },
      { 
        id: 4, 
        produit: 'Chaussures Running', 
        code: 'CHR004', 
        client: 'Client D', 
        quantite: 1, 
        prix: 89.99,
        total: 89.99,
        date: '2024-01-06',
        statut: 'Complétée',
        produit_id: 4,
        magasin_id: 1
      },
      { 
        id: 5, 
        produit: 'Sac à Dos', 
        code: 'SAC005', 
        client: 'Client E', 
        quantite: 2, 
        prix: 30.00,
        total: 60.00,
        date: '2024-01-05',
        statut: 'Complétée',
        produit_id: 5,
        magasin_id: 1
      }
    ];
  }

  // Actions CRUD
  addVente(): void {
    this.selectedVente = { 
      id: 0, 
      produit_id: null,
      produit: '', 
      code: '', 
      client: '', 
      quantite: 1, 
      prix: 0,
      total: 0,
      date: new Date().toISOString().slice(0, 10),
      statut: 'En attente',
      type_mouvement: 'sortie',
      motif: ''
    };
    this.showEditPopup = true;
  }

  editVente(vente: any): void {
    this.selectedVente = { ...vente };
    this.showEditPopup = true;
  }

  deleteVente(vente: any): void {
    this.selectedVente = vente;
    this.showDeletePopup = true;
  }

  async confirmEdit(): Promise<void> {
    if (!this.selectedVente) return;

    try {
      // Calculer le total automatiquement
      this.selectedVente.total = this.selectedVente.quantite * this.selectedVente.prix;
      
      // Préparer les données pour l'API
      const mouvementData = {
        produit_id: this.selectedVente.produit_id,
        magasin_id: 1, // À adapter selon votre logique
        categorie_id: 1, // À adapter
        type_mouvement: 'sortie',
        quantite: this.selectedVente.quantite,
        prix_unitaire: this.selectedVente.prix,
        date_mouvement: this.selectedVente.date,
        motif: this.selectedVente.client
      };

      if (this.selectedVente.id === 0) {
        // Ajouter une nouvelle vente
        this.authService.addMouvement(mouvementData).subscribe({
          next: (newMouvement) => {
            console.log('✅ Vente ajoutée:', newMouvement);
            this.loadVentes(); // Recharger la liste
            this.loadStatsVentes(); // Recharger les stats
            this.closePopups();
          },
          error: (error) => {
            console.error('❌ Erreur ajout vente:', error);
            alert('Erreur lors de l\'ajout de la vente: ' + (error.error?.message || 'Erreur serveur'));
          }
        });
      } else {
        // Modifier une vente existante
        this.authService.updateMouvement(this.selectedVente.id, mouvementData).subscribe({
          next: (updatedMouvement) => {
            console.log('✅ Vente modifiée:', updatedMouvement);
            this.loadVentes(); // Recharger la liste
            this.loadStatsVentes(); // Recharger les stats
            this.closePopups();
          },
          error: (error) => {
            console.error('❌ Erreur modification vente:', error);
            alert('Erreur lors de la modification de la vente: ' + (error.error?.message || 'Erreur serveur'));
          }
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  }

  async confirmDelete(): Promise<void> {
    if (!this.selectedVente) return;

    try {
      this.authService.deleteMouvement(this.selectedVente.id).subscribe({
        next: () => {
          console.log('✅ Vente supprimée avec succès');
          this.loadVentes(); // Recharger la liste
          this.loadStatsVentes(); // Recharger les stats
          this.closePopups();
        },
        error: (error) => {
          console.error('❌ Erreur suppression vente:', error);
          alert('Erreur lors de la suppression de la vente: ' + (error.error?.message || 'Erreur serveur'));
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
    this.selectedVente = null;
  }

  updateVenteField(field: string, value: any): void {
    if (this.selectedVente) {
      this.selectedVente[field] = value;
      
      // Recalculer le total si quantité ou prix change
      if (field === 'quantite' || field === 'prix') {
        this.selectedVente.total = this.selectedVente.quantite * this.selectedVente.prix;
      }
      
      // Si produit change, mettre à jour le code et l'ID
      if (field === 'produit_id') {
        const produitSelectionne = this.produits.find(p => p.id == value);
        if (produitSelectionne) {
          this.selectedVente.produit = produitSelectionne.nom;
          this.selectedVente.code = produitSelectionne.code;
          this.selectedVente.prix = produitSelectionne.prix || 0;
          this.selectedVente.total = this.selectedVente.quantite * this.selectedVente.prix;
        }
      }
    }
  }

  onProduitChange(event: any): void {
    const produitId = event.target.value;
    this.updateVenteField('produit_id', produitId);
  }

  appliquerFiltres(): void {
    console.log('Filtres appliqués:', this.dateDebut, this.dateFin);
    this.loadVentes();
    this.loadStatsVentes();
  }

  reinitialiserFiltres(): void {
    this.setDefaultDates();
    this.loadVentes();
    this.loadStatsVentes();
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'Complétée': return 'statut-complete';
      case 'En attente': return 'statut-pending';
      case 'Annulée': return 'statut-cancelled';
      default: return 'statut-pending';
    }
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}