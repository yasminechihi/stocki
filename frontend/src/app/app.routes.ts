import { Routes } from '@angular/router';
import { App } from './app';
import { Accueil } from './accueil/accueil';
import { Magasin } from './magasin/magasin';
import { Categorie } from './categorie/categorie';
import { Produit } from './produit/produit';
import { Contact } from './contact/contact';
import { Dashboard } from './dashboard/dashboard';
import { Ventes } from './ventes/ventes';
import { Stock } from './stock/stock';
import { Mouvements } from './mouvements/mouvements';

export const routes: Routes = [
  { 
    path: '',  
    redirectTo: '/accueil',
    pathMatch: 'full'
  },
  { 
    path: 'accueil', 
    component: Accueil
  },
  { 
    path: 'dashboard', 
    component: Dashboard
  },
  { 
    path: 'contact',
    component: Contact
  },
  { 
    path: 'magasin', 
    component: Magasin
  },
  { 
    path: 'categorie', 
    component: Categorie
  },
  { 
    path: 'produit', 
    component: Produit
  },
  { 
    path: 'ventes', 
    component: Ventes
  },
  { 
    path: 'stock', 
    component: Stock
  },
  { 
    path: 'mouvements', 
    component: Mouvements
  },
  { 
    path: '**',  
    redirectTo: '/accueil'
  }
];