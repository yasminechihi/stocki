import { Component } from '@angular/core';
import { RouterLink, RouterModule, Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.html',
  styleUrls: ['./accueil.css'],
  imports: [RouterLink, RouterModule, CommonModule, FormsModule]
})
export class Accueil {
  showAuthModal = false;
  showLoginTab = true;
  showVideoModal = false;
  
  loginData = {
    email: '',
    password: ''
  };
  
  registerData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  isLoading = false;
  errorMessage = '';
  videoUrl: SafeResourceUrl;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube.com/embed/qHwj1sTpdcA'
    );
  }

  // Méthode pour ouvrir la popup d'authentification
  openAuthModal() {
    this.showAuthModal = true;
    this.showLoginTab = true;
    this.loginData = { email: '', password: '' };
    this.registerData = { name: '', email: '', password: '', confirmPassword: '' };
    this.errorMessage = '';
  }

  // Méthode pour fermer la popup
  closeAuthModal() {
    this.showAuthModal = false;
    this.errorMessage = '';
  }

  // Méthode pour basculer vers l'onglet inscription
  showRegister() {
    this.showLoginTab = false;
    this.errorMessage = '';
  }

  // Méthode pour basculer vers l'onglet connexion
  showLogin() {
    this.showLoginTab = true;
    this.errorMessage = '';
  }

  // Méthode pour la connexion
  onLogin() {
    console.log('🚨 onLogin() appelée !', this.loginData);
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Connexion réussie:', response);
        this.closeAuthModal();
        this.router.navigate(['/magasin']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Erreur de connexion';
        console.error('Erreur de connexion:', error);
      }
    });
  }

  // Méthode pour l'inscription
  onRegister() {
    console.log('🚨 onRegister() appelée !', this.registerData);
    
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Inscription réussie:', response);
        this.closeAuthModal();
        this.router.navigate(['/magasin']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || "Erreur d'inscription";
        console.error("Erreur d'inscription:", error);
      }
    });
  }

  // Méthode pour démarrer l'essai gratuit
  startFreeTrial() {
    console.log('Démarrage de l\'essai gratuit');
    this.openAuthModal();
  }

  // Méthode pour ouvrir la popup vidéo
  openVideoModal() {
    this.showVideoModal = true;
  }

  // Méthode pour fermer la popup vidéo
  closeVideoModal() {
    this.showVideoModal = false;
  }

  // Méthode pour regarder la démo
  watchDemo() {
    console.log('Lecture de la démo vidéo');
    this.openVideoModal();
  }
}