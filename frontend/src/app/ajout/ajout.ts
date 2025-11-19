import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ajout',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './ajout.html',
  styleUrls: ['./ajout.css']
})
export class Ajout {
  ajoutForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.ajoutForm = this.fb.group({
      id: [''],
      nom: [''],
      adresse: [''],
      categorie: ['']
    });
  }

  onSubmit() {
    console.log('Magasin ajouté :', this.ajoutForm.value);
    alert('Magasin ajouté avec succès ✅');
    this.ajoutForm.reset();
  }
}
