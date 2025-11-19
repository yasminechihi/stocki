import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,      // utile pour *ngIf, *ngFor etc.
    RouterOutlet,      // pour charger les routes
    HttpClientModule   // pour HttpClient (services API)
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  // Tu peux mettre des propriétés ou méthodes si besoin
}
