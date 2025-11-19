import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ajoutprod } from './ajoutprod';

describe('Ajoutprod', () => {
  let component: Ajoutprod;
  let fixture: ComponentFixture<Ajoutprod>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ajoutprod]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ajoutprod);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
