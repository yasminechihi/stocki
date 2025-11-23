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
  openAuthModal() {
    this.showAuthModal = true;
    this.showLoginTab = true;
    this.resetForms();
  }
  closeAuthModal() {
    this.showAuthModal = false;
    this.showVerificationModal = false;
    this.show2FAModal = false;
    this.resetForms();
  }
  resetForms() {
    this.loginData = { email: '', password: '' };
    this.registerData = { name: '', email: '', password: '', confirmPassword: '' };
    this.verificationData = { userId: '', code: '' };
    this.errorMessage = '';
    this.successMessage = '';
    this.currentUserId = '';
  }
  showRegister() {
    this.showLoginTab = false;
    this.errorMessage = '';
    this.successMessage = '';
  }
  showLogin() {
    this.showLoginTab = true;
    this.errorMessage = '';
    this.successMessage = '';
  }
  onLogin() {
    console.log('🚨 onLogin() appelée !', this.loginData);
    
    // Validation de l'email côté client
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.loginData.email)) {
      this.errorMessage = 'Format d\'email invalide';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Réponse connexion:', response);
        
        if (response.requires2FA && response.userId) {
          this.currentUserId = response.userId;
          this.showAuthModal = false; 
          this.show2FAModal = true;  
          this.successMessage = 'Code de sécurité envoyé à votre email';
          this.loginData = { email: '', password: '' };
        } else if (response.token && response.user) {
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
  onRegister() {
    console.log('🚨 onRegister() appelée !', this.registerData);
    
    // Validation de l'email côté client
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerData.email)) {
      this.errorMessage = 'Format d\'email invalide';
      return;
    }

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
    this.successMessage = '';

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Inscription réussie:', response);
        
        if (response.success) {
          // Compte créé avec succès - on affiche un message et on reste sur la modale
          this.successMessage = response.message;
          
          // On pré-remplit l'email dans le formulaire de connexion
          this.loginData.email = this.registerData.email;
          this.loginData.password = ''; // On vide le mot de passe pour la sécurité
          
          // On passe à l'onglet connexion mais on garde la modale ouverte
          this.showLoginTab = true;
          
          // On réinitialise seulement les données d'inscription
          this.registerData = { name: '', email: '', password: '', confirmPassword: '' };
          
          // Message temporaire qui disparaît après 3 secondes
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || "Erreur d'inscription";
        console.error("Erreur d'inscription:", error);
      }
    });
  }
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
  startFreeTrial() {
    console.log('Démarrage de l\'essai gratuit');
    this.openAuthModal();
  }
  openVideoModal() {
    this.showVideoModal = true;
  }
  closeVideoModal() {
    this.showVideoModal = false;
  }
  watchDemo() {
    console.log('Lecture de la démo vidéo');
    this.openVideoModal();
  }
}