import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class Contact {
  
  // Données du formulaire de contact
  contactData = {
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  };

  // Variables pour la popup d'authentification
  showAuthModal = false;
  showLoginTab = true;
  
  // Données du formulaire d'authentification
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

  // États pour le formulaire de contact
  contactLoading = false;
  contactErrorMessage = '';
  contactSuccessMessage = '';

  // États pour l'authentification
  authLoading = false;
  authErrorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Méthode pour le formulaire de contact
  onSubmit() {
    this.contactLoading = true;
    this.contactErrorMessage = '';
    this.contactSuccessMessage = '';

    this.authService.contact(this.contactData).subscribe({
      next: (response) => {
        this.contactLoading = false;
        this.contactSuccessMessage = 'Votre message a été envoyé avec succès! Nous vous répondrons dans les plus brefs délais.';
        console.log('Message envoyé:', response);
        
        // Réinitialiser le formulaire
        this.contactData = {
          name: '',
          email: '',
          company: '',
          subject: '',
          message: ''
        };
      },
      error: (error) => {
        this.contactLoading = false;
        this.contactErrorMessage = error.error?.message || 'Erreur lors de l\'envoi du message';
        console.error('Erreur envoi message:', error);
      }
    });
  }

  // Méthodes pour la popup d'authentification
  openAuthModal() {
    this.showAuthModal = true;
    this.showLoginTab = true;
    this.authErrorMessage = '';
    this.loginData = { email: '', password: '' };
    this.registerData = { name: '', email: '', password: '', confirmPassword: '' };
  }

  closeAuthModal() {
    this.showAuthModal = false;
    this.authErrorMessage = '';
  }

  showRegister() {
    this.showLoginTab = false;
    this.authErrorMessage = '';
  }

  showLogin() {
    this.showLoginTab = true;
    this.authErrorMessage = '';
  }

  onLogin() {
    this.authLoading = true;
    this.authErrorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.authLoading = false;
        
        if (response.requires2FA) {
          // Rediriger vers la page de vérification 2FA
          this.router.navigate(['/verify-2fa'], { 
            state: { 
              userId: response.userId,
              debugCode: response.debugCode 
            } 
          });
          this.closeAuthModal();
        } else if (response.token) {
          console.log('Connexion réussie:', response);
          this.closeAuthModal();
          this.router.navigate(['/magasin']);
        }
      },
      error: (error) => {
        this.authLoading = false;
        this.authErrorMessage = error.error?.message || 'Erreur de connexion';
        console.error('Erreur de connexion:', error);
      }
    });
  }

  onRegister() {
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.authErrorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.authErrorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    this.authLoading = true;
    this.authErrorMessage = '';

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.authLoading = false;
        
        if (response.requiresVerification) {
          // Rediriger vers la page de vérification
          this.router.navigate(['/verify-account'], { 
            state: { userId: response.userId } 
          });
          this.closeAuthModal();
        } else {
          console.log('Inscription réussie:', response);
          this.closeAuthModal();
          this.router.navigate(['/magasin']);
        }
      },
      error: (error) => {
        this.authLoading = false;
        this.authErrorMessage = error.error?.message || "Erreur d'inscription";
        console.error("Erreur d'inscription:", error);
      }
    });
  }
}