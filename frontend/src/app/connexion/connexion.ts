import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../services/auth'; // ✅ Assure-toi que le fichier est bien auth.service.ts

@Component({
  selector: 'app-connexion',
  standalone: true, // si tu utilises Angular standalone components
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './connexion.html',
  styleUrls: ['./connexion.css']
})
export class Connexion {
  signinForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.signinForm = this.fb.group({
      matricule: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.signinForm.valid) {
      this.authService.login(this.signinForm.value).subscribe({
        next: (res: any) => {
          console.log('✅ Connexion réussie :', res);
          this.goToaccueil(); // redirection après succès
        },
        error: (err: any) => console.error('❌ Erreur :', err)
      });
    }
  }

  goToaccueil() {
    this.router.navigate(['/accueil']);
  }

  protected readonly title = signal('test');
}
