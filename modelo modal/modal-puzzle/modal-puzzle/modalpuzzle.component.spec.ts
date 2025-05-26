import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPuzzleComponent} from './modalpuzzle.component';

describe('ModalComponent', () => {
  let component: ModalPuzzleComponent;
  let fixture: ComponentFixture<ModalPuzzleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPuzzleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalPuzzleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
