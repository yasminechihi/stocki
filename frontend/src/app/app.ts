import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,      
    RouterOutlet,      
    HttpClientModule  
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
}
