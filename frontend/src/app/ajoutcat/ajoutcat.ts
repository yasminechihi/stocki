import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ajoutcat',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './ajoutcat.html',
  styleUrls: ['./ajoutcat.css']
})
export class Ajoutcat {
  ajoutcatForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.ajoutcatForm = this.fb.group({
      id: [''],
      nom: [''],
      description: [''],
      produits: ['']
    });
  }

  onSubmit() {
    console.log('catégorie ajouté :', this.ajoutcatForm.value);
    alert('catégorie ajouté avec succès ✅');
    this.ajoutcatForm.reset();
  }
}
