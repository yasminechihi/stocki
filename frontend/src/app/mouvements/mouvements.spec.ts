import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mouvements } from './mouvements';

describe('Mouvements', () => {
  let component: Mouvements;
  let fixture: ComponentFixture<Mouvements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mouvements]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mouvements);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
