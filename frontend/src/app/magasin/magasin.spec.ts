import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Magasin } from './magasin';

describe('Magasin', () => {
  let component: Magasin;
  let fixture: ComponentFixture<Magasin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Magasin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Magasin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
