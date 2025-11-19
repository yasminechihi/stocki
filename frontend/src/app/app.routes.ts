import { Routes } from '@angular/router';
import { App } from './app';
import { Connexion } from './connexion/connexion';
import { Inscription } from './inscription/inscription';
import { Accueil } from './accueil/accueil';
import { Magasin } from './magasin/magasin';
import { Categorie } from './categorie/categorie';
import { Produit } from './produit/produit';
import { Ajout } from './ajout/ajout';
import { Ajoutcat } from './ajoutcat/ajoutcat';
import { Ajoutprod  } from './ajoutprod/ajoutprod';
import { Contact } from './contact/contact'; // ← Importez le composant Contact

export const routes: Routes = [
    { 
    path: 'inscription', 
    component: Inscription
  },
  { 
    path: 'connexion', 
    component: Connexion
  },
  { 
    path: 'accueil', 
    component: Accueil
  },
  { 
    path: 'contact',  // ← Ajoutez cette route
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
    path: 'ajout', 
    component: Ajout
  },
  { 
    path: 'ajoutcat', 
    component: Ajoutcat
  },
  { 
    path: 'ajoutprod', 
    component: Ajoutprod
  },
  { 
    path: '',  // ← Route par défaut
    redirectTo: '/accueil',
    pathMatch: 'full'
  }
];