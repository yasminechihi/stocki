import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // ← AJOUT IMPORTANT

@Component({
  standalone: true,
  selector: 'app-magasin',
  templateUrl: './magasin.html',
  styleUrls: ['./magasin.css'],
  imports: [CommonModule, RouterModule] // ← AJOUT RouterModule
})
export class Magasin {
  
  produits = [
    { image: 'assets/decathlon.png', nom: 'Decathlon Tunis City', code: '000354865', type: 'Interne', adresse: 'Cebelat Ammar 2032 Ariana' },
    { image: 'assets/decathlon.png', nom: 'Decathlon La Marsa', code: '000748956', type: 'Interne', adresse: 'direction, GP9, Tunis' },
    { image: 'assets/decathlon.png', nom: 'Decathlon Mall Of Sousse', code: '000426789', type: 'Interne', adresse: 'Mall Of Sousse RN1, Tunis Km 128.' },
    { image: 'assets/decathlon.png', nom: 'Decathlon Azur City', code: '000125789', type: 'Interne', adresse: '2097 Boumhel، Ben Arous 2013' },
    { image: 'assets/decathlon.png', nom: 'Decathlon Tunis', code: '456741852', type: 'Vente', prix: -11 },
    { image: 'assets/decathlon.png', nom: 'Decathlon Mall Of Sfax', code: '456963123', type: 'Vente', adresse: 'RQR6+MX3, Sfax' },
    { image: 'assets/decathlon.png', nom: 'Decathlon Soukra', code: '456852159', type: 'Vente', prix: 14 },
    { image: 'assets/decathlon.png', nom: 'Decathlon Tunisia Mall', code: '456963147', type: 'Vente', prix: 20 },
    { image: 'assets/decathlon.png', nom: 'Decathlon Djerba', code: '123789555', type: 'Vente', prix: 5 },
  ];

}