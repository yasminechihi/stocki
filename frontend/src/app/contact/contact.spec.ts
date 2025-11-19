import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Contact } from './contact';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';

describe('Contact', () => {
  let component: Contact;
  let fixture: ComponentFixture<Contact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact, RouterTestingModule, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Contact);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty initial form data', () => {
    expect(component.contactData.name).toBe('');
    expect(component.contactData.email).toBe('');
    expect(component.contactData.company).toBe('');
    expect(component.contactData.subject).toBe('');
    expect(component.contactData.message).toBe('');
  });

  it('should reset form after submission', () => {
    // Simuler des données de formulaire
    component.contactData = {
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company',
      subject: 'demo',
      message: 'Test message'
    };

    component.onSubmit();

    // Vérifier que le formulaire est réinitialisé
    expect(component.contactData.name).toBe('');
    expect(component.contactData.email).toBe('');
    expect(component.contactData.company).toBe('');
    expect(component.contactData.subject).toBe('');
    expect(component.contactData.message).toBe('');
  });
});