import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-inscription',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inscription.html',
  styleUrls: ['./inscription.css']
})
export class Inscription {
  signupForm;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService // ✅ injection du service
  ) {
    this.signupForm = this.fb.group({
      matricule: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)
      ]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
    }, { validators: this.passwordMatchValidator });
  }

  // Vérifie que password == confirmPassword
  passwordMatchValidator(formGroup: any) {
    const pass = formGroup.get('password')?.value;
    const confirm = formGroup.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  // ✅ Envoi des données vers le backend
  onSubmit() {
    if (this.signupForm.valid) {
      // On enlève confirmPassword avant d'envoyer
      const { confirmPassword, ...formData } = this.signupForm.value;
        console.log("📤 Données envoyées au backend :", formData); // 👈 debug

      this.authService.signup(this.signupForm.value).subscribe({
        next: (res:any) => {
          console.log('✅ Inscription réussie :', res);
          this.goToConnexion(); // redirection après succès
        },
        error: (err:any) => console.error('❌ Erreur :', err)
      });
    }
  }

  // ✅ Redirection vers page connexion
  goToConnexion() {
    this.router.navigate(['/connexion']);
  }

  // Optionnel : exemple avec signal
  title = signal('test');
}
