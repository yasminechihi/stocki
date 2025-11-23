import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth';

// Import correct pour Chart.js
declare var Chart: any;

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [CommonModule, RouterModule],
  providers: [DecimalPipe, DatePipe]
})
export class Dashboard implements OnInit, AfterViewInit {
  @ViewChild('activityChart') activityChartRef!: ElementRef;

  currentUser: any = null;
  isLoading = true;
  
  // Initialisation correcte des propriétés
  dashboardData: any = {
    totalMouvements: 0,
    totalProduits: 0,
    totalMagasins: 0,
    totalCategories: 0,
    valeurStock: 0,
    alertesStock: 0,
    mouvementChange: 0,
    produitChange: 0,
    valeurChange: 0
  };

  recentMouvements: any[] = [];
  lowStockProducts: any[] = [];
  activityChart: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initActivityChart();
    }, 500);
  }

  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      console.error('Aucun utilisateur connecté');
      this.router.navigate(['/login']);
    }
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    Promise.all([
      this.loadMouvementsData(),
      this.loadProduitsData(),
      this.loadMagasinsData(),
      this.loadCategoriesData(),
      this.loadStockData()
    ]).then(() => {
      this.loadRecentMouvements();
      this.loadLowStockProducts();
    }).catch((error) => {
      console.error('Erreur lors du chargement des données:', error);
    }).finally(() => {
      this.isLoading = false;
    });
  }

  private async loadMouvementsData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.authService.getMouvements().subscribe({
        next: (mouvements: any[]) => {
          this.dashboardData.totalMouvements = mouvements?.length || 0;
          this.dashboardData.mouvementChange = 12;
          resolve();
        },
        error: (error) => {
          console.error('Erreur chargement mouvements:', error);
          this.dashboardData.totalMouvements = 0;
          this.dashboardData.mouvementChange = 0;
          reject(error);
        }
      });
    });
  }

  private async loadProduitsData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.authService.getProduits().subscribe({
        next: (produits: any[]) => {
          this.dashboardData.totalProduits = produits?.length || 0;
          this.dashboardData.produitChange = 8;
          resolve();
        },
        error: (error) => {
          console.error('Erreur chargement produits:', error);
          this.dashboardData.totalProduits = 0;
          this.dashboardData.produitChange = 0;
          reject(error);
        }
      });
    });
  }

  private async loadMagasinsData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.authService.getMagasins().subscribe({
        next: (magasins: any[]) => {
          this.dashboardData.totalMagasins = magasins?.length || 0;
          resolve();
        },
        error: (error) => {
          console.error('Erreur chargement magasins:', error);
          this.dashboardData.totalMagasins = 0;
          reject(error);
        }
      });
    });
  }

  private async loadCategoriesData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.authService.getCategories().subscribe({
        next: (categories: any[]) => {
          this.dashboardData.totalCategories = categories?.length || 0;
          resolve();
        },
        error: (error) => {
          console.error('Erreur chargement catégories:', error);
          this.dashboardData.totalCategories = 0;
          reject(error);
        }
      });
    });
  }

  private async loadStockData(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.dashboardData.valeurStock = 15420.75;
        this.dashboardData.valeurChange = 5.2;
        this.dashboardData.alertesStock = 3;
        resolve();
      }, 300);
    });
  }

  loadRecentMouvements(): void {
    this.authService.getMouvements().subscribe({
      next: (mouvements: any[]) => {
        this.recentMouvements = mouvements
          .sort((a: any, b: any) => {
            const dateA = new Date(a.date_mouvement || a.created_at);
            const dateB = new Date(b.date_mouvement || b.created_at);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5);
      },
      error: (error) => {
        console.error('Erreur chargement mouvements récents:', error);
        this.recentMouvements = [];
      }
    });
  }

  loadLowStockProducts(): void {
    this.lowStockProducts = [
      {
        nom: 'Smartphone Galaxy S23',
        quantite: 5,
        seuil_alerte: 10,
        magasin_nom: 'Principal'
      },
      {
        nom: 'Casque Bluetooth Pro',
        quantite: 3,
        seuil_alerte: 8,
        magasin_nom: 'Principal'
      },
      {
        nom: 'Câble USB-C 2m',
        quantite: 12,
        seuil_alerte: 15,
        magasin_nom: 'Secondaire'
      }
    ];
  }

  initActivityChart(): void {
    if (!this.activityChartRef?.nativeElement) {
      console.warn('Canvas element not found');
      return;
    }

    const ctx = this.activityChartRef.nativeElement.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    if (this.activityChart) {
      this.activityChart.destroy();
    }
    
    // Vérifier que Chart est disponible
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not available');
      return;
    }
    
    this.activityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [
          {
            label: 'Entrées',
            data: [12, 19, 8, 15, 12, 5, 9],
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Sorties',
            data: [8, 12, 6, 9, 15, 12, 7],
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 12,
                weight: '600'
              },
              color: '#2c3e50'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(44, 62, 80, 0.9)',
            titleFont: {
              size: 13,
              weight: '600'
            },
            bodyFont: {
              size: 12
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              color: '#6c757d',
              font: {
                size: 11,
                weight: '500'
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              color: '#6c757d',
              font: {
                size: 11,
                weight: '500'
              }
            }
          }
        }
      }
    });
  }

  // Méthodes manquantes
  changeChartPeriod(period: string): void {
    console.log('Changement de période:', period);
    
    let newDataEntrees: number[];
    let newDataSorties: number[];
    let newLabels: string[];
    
    switch (period) {
      case '7j':
        newLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        newDataEntrees = [12, 19, 8, 15, 12, 5, 9];
        newDataSorties = [8, 12, 6, 9, 15, 12, 7];
        break;
      case '30j':
        newLabels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        newDataEntrees = [45, 52, 48, 55];
        newDataSorties = [38, 42, 45, 48];
        break;
      case '90j':
        newLabels = ['M1', 'M2', 'M3'];
        newDataEntrees = [180, 195, 210];
        newDataSorties = [165, 180, 195];
        break;
      default:
        newLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        newDataEntrees = [12, 19, 8, 15, 12, 5, 9];
        newDataSorties = [8, 12, 6, 9, 15, 12, 7];
    }

    if (this.activityChart) {
      this.activityChart.data.labels = newLabels;
      this.activityChart.data.datasets[0].data = newDataEntrees;
      this.activityChart.data.datasets[1].data = newDataSorties;
      this.activityChart.update();
    }
  }

  getChangeClass(change: number): string {
    if (change > 0) return 'change-positive';
    if (change < 0) return 'change-negative';
    return 'change-neutral';
  }

  getMouvementIcon(type: string): string {
    switch (type) {
      case 'entree': return '📥';
      case 'sortie': return '📤';
      case 'ajustement': return '⚖️';
      default: return '📋';
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }

  refreshData(): void {
    this.isLoading = true;
    this.loadDashboardData();
  }

  // Méthodes utilitaires pour les pipes
  formatNumber(value: number): string {
    return this.decimalPipe.transform(value, '1.2-2') || '0.00';
  }

  formatDate(value: string): string {
    return this.datePipe.transform(value, 'dd/MM') || '';
  }
}