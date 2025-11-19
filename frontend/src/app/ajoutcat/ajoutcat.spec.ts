import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ajoutcat } from './ajoutcat';

describe('Ajoutcat', () => {
  let component: Ajoutcat;
  let fixture: ComponentFixture<Ajoutcat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ajoutcat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ajoutcat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
