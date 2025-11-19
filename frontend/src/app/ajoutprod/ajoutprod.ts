import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ajoutprod',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './ajoutprod.html',
  styleUrls: ['./ajoutprod.css']
})
export class Ajoutprod {
  ajoutprodForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.ajoutprodForm = this.fb.group({
      id: [''],
      nom: [''],
      description: [''],
      produits: ['']
    });
  }

  onSubmit() {
    console.log('produit ajouté :', this.ajoutprodForm.value);
    alert('produit ajouté avec succès ✅');
    this.ajoutprodForm.reset();
  }
}

