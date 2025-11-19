import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // ← AJOUT IMPORTANT

@Component({
  standalone: true,
  selector: 'app-Produit',
  templateUrl: './produit.html',
  styleUrls: ['./produit.css'],
  imports: [CommonModule, RouterModule], // ← AJOUT RouterModule
})
export class Produit {

  produits = [
    { image: 'assets/fitness.png', nom: 'Fitness & Gymnastique', code: '123789555', type: 'Vente', prix: 5 },
    { image: 'assets/course.png', nom: 'Marche & Course', code: '123789555', type: 'Vente', prix: 5 },
    { image: 'assets/bagage.png', nom: 'Bagagerie', code: '000354865', type: 'Interne', adresse: 'Cebelat Ammar 2032 Ariana' },
    { image: 'assets/bouteille.avif', nom: 'Bouteilles et contenants', code: '000748956', type: 'Interne', adresse: 'direction, GP9, Tunis' },
    { image: 'assets/montre.png', nom: 'Montres et orientation', code: '000426789', type: 'Interne', adresse: 'Mall Of Sousse RN1, Tunis Km 128.' },
    { image: 'assets/massage.png', nom: 'Massage et Santé', code: '000125789', type: 'Interne', adresse: '2097 Boumhel, Ben Arous 2013' },
    { image: 'assets/lunette.png', nom: 'Lunettes de soleil', code: '456741852', type: 'Vente', prix: -11 },
    { image: 'assets/jeux.png', nom: 'Jeux', code: '456963123', type: 'Vente', adresse: 'RQR6+MX3, Sfax' },
  ];

  // SUPPRIMER les méthodes d'authentification qui ne sont plus nécessaires
  // car vous avez des composants séparés pour Connexion/Inscription
}