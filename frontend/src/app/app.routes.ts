import { Routes } from '@angular/router';
import { App } from './app';
import { Accueil } from './accueil/accueil';
import { Magasin } from './magasin/magasin';
import { Categorie } from './categorie/categorie';
import { Produit } from './produit/produit';
import { Contact } from './contact/contact';

export const routes: Routes = [
  { 
    path: 'accueil', 
    component: Accueil
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
    path: '',  // ← Route par défaut
    redirectTo: '/accueil',
    pathMatch: 'full'
  }
];