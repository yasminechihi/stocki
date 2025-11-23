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
  contactData = {
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  };
  
  showAuthModal = false;
  showLoginTab = true;
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
  
  contactLoading = false;
  contactErrorMessage = '';
  contactSuccessMessage = '';
  
  authLoading = false;
  authErrorMessage = '';
  authSuccessMessage = '';
  
  currentUserId: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.contactLoading = true;
    this.contactErrorMessage = '';
    this.contactSuccessMessage = '';
    
    this.authService.contact(this.contactData).subscribe({
      next: (response) => {
        this.contactLoading = false;
        this.contactSuccessMessage = 'Votre message a été envoyé avec succès! Nous vous répondrons dans les plus brefs délais.';
        console.log('Message envoyé:', response);
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

  openAuthModal() {
    this.showAuthModal = true;
    this.showLoginTab = true;
    this.resetAuthForms();
  }

  closeAuthModal() {
    this.showAuthModal = false;
    this.showVerificationModal = false;
    this.show2FAModal = false;
    this.resetAuthForms();
  }

  resetAuthForms() {
    this.loginData = { email: '', password: '' };
    this.registerData = { name: '', email: '', password: '', confirmPassword: '' };
    this.verificationData = { userId: '', code: '' };
    this.authErrorMessage = '';
    this.authSuccessMessage = '';
    this.currentUserId = '';
  }

  showRegister() {
    this.showLoginTab = false;
    this.authErrorMessage = '';
    this.authSuccessMessage = '';
  }

  showLogin() {
    this.showLoginTab = true;
    this.authErrorMessage = '';
    this.authSuccessMessage = '';
  }

  onLogin() {
    // Validation de l'email côté client
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.loginData.email)) {
      this.authErrorMessage = 'Format d\'email invalide';
      return;
    }

    this.authLoading = true;
    this.authErrorMessage = '';
    this.authSuccessMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.authLoading = false;
        console.log('Réponse connexion:', response);
        
        if (response.requires2FA && response.userId) {
          this.currentUserId = response.userId;
          this.showAuthModal = false; 
          this.show2FAModal = true;  
          this.authSuccessMessage = 'Code de sécurité envoyé à votre email';
          this.loginData = { email: '', password: '' };
        } else if (response.token && response.user) {
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

  onVerify2FA() {
    if (!this.verificationData.code) {
      this.authErrorMessage = 'Veuillez entrer le code de sécurité reçu par email';
      return;
    }

    this.authLoading = true;
    this.authErrorMessage = '';

    this.authService.verifyLogin({
      userId: this.currentUserId,
      code: this.verificationData.code
    }).subscribe({
      next: (response) => {
        this.authLoading = false;
        console.log('Vérification 2FA réussie:', response);
        
        if (response.token && response.user) {
          this.closeAuthModal();
          this.router.navigate(['/magasin']);
          this.authSuccessMessage = 'Connexion réussie!';
        }
      },
      error: (error) => {
        this.authLoading = false;
        this.authErrorMessage = error.error?.message || 'Code de sécurité invalide';
        console.error('Erreur vérification 2FA:', error);
      }
    });
  }

  onResend2FA() {
    this.authLoading = true;
    this.authErrorMessage = '';

    this.authService.resend2FA(this.currentUserId).subscribe({
      next: (response) => {
        this.authLoading = false;
        this.authSuccessMessage = response.message;
      },
      error: (error) => {
        this.authLoading = false;
        this.authErrorMessage = error.error?.message || 'Erreur lors de l\'envoi du code';
      }
    });
  }

  onRegister() {
    // Validation de l'email côté client
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerData.email)) {
      this.authErrorMessage = 'Format d\'email invalide';
      return;
    }

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
    this.authSuccessMessage = '';

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.authLoading = false;
        console.log('Inscription réussie:', response);
        
        if (response.success) {
          // Compte créé avec succès - on affiche un message et on reste sur la modale
          this.authSuccessMessage = response.message;
          
          // On pré-remplit l'email dans le formulaire de connexion
          this.loginData.email = this.registerData.email;
          this.loginData.password = ''; // On vide le mot de passe pour la sécurité
          
          // On passe à l'onglet connexion mais on garde la modale ouverte
          this.showLoginTab = true;
          
          // On réinitialise seulement les données d'inscription
          this.registerData = { name: '', email: '', password: '', confirmPassword: '' };
          
          // Message temporaire qui disparaît après 3 secondes
          setTimeout(() => {
            this.authSuccessMessage = '';
          }, 3000);
        }
      },
      error: (error) => {
        this.authLoading = false;
        this.authErrorMessage = error.error?.message || "Erreur d'inscription";
        console.error("Erreur d'inscription:", error);
      }
    });
  }

  onVerifyAccount() {
    if (!this.verificationData.code) {
      this.authErrorMessage = 'Veuillez entrer le code de vérification';
      return;
    }

    this.authLoading = true;
    this.authErrorMessage = '';

    this.authService.verifyAccount({
      userId: this.currentUserId,
      code: this.verificationData.code
    }).subscribe({
      next: (response) => {
        this.authLoading = false;
        console.log('Compte vérifié:', response);
        this.authSuccessMessage = 'Compte activé avec succès! Vous pouvez maintenant vous connecter.';
        setTimeout(() => {
          this.showVerificationModal = false;
          this.showLoginTab = true;
          this.showAuthModal = true;
        }, 2000);
      },
      error: (error) => {
        this.authLoading = false;
        this.authErrorMessage = error.error?.message || 'Code de vérification invalide';
        console.error('Erreur vérification compte:', error);
      }
    });
  }

  onResendVerification() {
    this.authLoading = true;
    this.authErrorMessage = '';

    this.authService.resendVerification(this.currentUserId).subscribe({
      next: (response) => {
        this.authLoading = false;
        this.authSuccessMessage = response.message;
      },
      error: (error) => {
        this.authLoading = false;
        this.authErrorMessage = error.error?.message || 'Erreur lors de l\'envoi du code';
      }
    });
  }
}