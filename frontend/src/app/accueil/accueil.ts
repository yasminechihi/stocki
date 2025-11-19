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
  showVerificationModal = false;
  show2FAModal = false;
  
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

  verificationData = {
    userId: '',
    code: ''
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  videoUrl: SafeResourceUrl;
  currentUserId: string = '';

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
    this.resetForms();
  }

  // Méthode pour fermer la popup
  closeAuthModal() {
    this.showAuthModal = false;
    this.showVerificationModal = false;
    this.show2FAModal = false;
    this.resetForms();
  }

  // Réinitialiser tous les formulaires
  resetForms() {
    this.loginData = { email: '', password: '' };
    this.registerData = { name: '', email: '', password: '', confirmPassword: '' };
    this.verificationData = { userId: '', code: '' };
    this.errorMessage = '';
    this.successMessage = '';
    this.currentUserId = '';
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

  // Méthode pour la connexion - CORRIGÉE
  onLogin() {
    console.log('🚨 onLogin() appelée !', this.loginData);
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Réponse connexion:', response);
        
        if (response.requires2FA && response.userId) {
          // Double authentification requise
          this.currentUserId = response.userId;
          this.showAuthModal = false; // Ferme la popup d'authentification principale
          this.show2FAModal = true;   // Ouvre la popup de vérification 2FA
          this.successMessage = 'Code de sécurité envoyé à votre email';
          
          // Réinitialiser le formulaire de connexion
          this.loginData = { email: '', password: '' };
        } else if (response.token && response.user) {
          // Connexion directe (sans 2FA) - Redirection vers magasin
          this.closeAuthModal();
          this.router.navigate(['/magasin']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Erreur de connexion';
        console.error('Erreur de connexion:', error);
      }
    });
  }

  // Méthode pour vérifier le code 2FA - CORRIGÉE
  onVerify2FA() {
    if (!this.verificationData.code) {
      this.errorMessage = 'Veuillez entrer le code de sécurité reçu par email';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyLogin({
      userId: this.currentUserId,
      code: this.verificationData.code
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Vérification 2FA réussie:', response);
        
        if (response.token && response.user) {
          // Connexion réussie - Redirection vers la page catégorie/magasin
          this.closeAuthModal();
          this.router.navigate(['/magasin']);
          this.successMessage = 'Connexion réussie!';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Code de sécurité invalide';
        console.error('Erreur vérification 2FA:', error);
      }
    });
  }

  // Méthode pour renvoyer le code 2FA
  onResend2FA() {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resend2FA(this.currentUserId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Erreur lors de l\'envoi du code';
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
        
        if (response.requiresVerification && response.userId) {
          // Vérification du compte requise
          this.currentUserId = response.userId;
          this.showAuthModal = false;
          this.showVerificationModal = true;
          this.successMessage = 'Compte créé! Vérifiez votre email pour le code d\'activation.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || "Erreur d'inscription";
        console.error("Erreur d'inscription:", error);
      }
    });
  }

  // Méthode pour vérifier le compte après inscription
  onVerifyAccount() {
    if (!this.verificationData.code) {
      this.errorMessage = 'Veuillez entrer le code de vérification';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyAccount({
      userId: this.currentUserId,
      code: this.verificationData.code
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Compte vérifié:', response);
        this.successMessage = 'Compte activé avec succès! Vous pouvez maintenant vous connecter.';
        
        // Retour à la connexion après 2 secondes
        setTimeout(() => {
          this.showVerificationModal = false;
          this.showLoginTab = true;
          this.showAuthModal = true;
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Code de vérification invalide';
        console.error('Erreur vérification compte:', error);
      }
    });
  }

  // Méthode pour renvoyer le code de vérification
  onResendVerification() {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resendVerification(this.currentUserId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Erreur lors de l\'envoi du code';
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