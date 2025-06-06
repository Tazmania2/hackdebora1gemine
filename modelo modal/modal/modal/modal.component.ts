import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  step = 1;

  nextStep() {
    if (this.step < 3) {
      this.step++;
    } else {
      this.reset();
    }
  }

  reset() {
    this.step = 1;
    this.close.emit();
  }

  get buttonLabel(): string {
    return this.step < 3 ? 'Próximo Passo' : 'Finalizar';
  }

  get personagemSrc(): string {
    switch (this.step) {
      case 1: return '/imagens/personagem1.png';
      case 2: return '/imagens/personagem2.png';
      case 3: return '/imagens/personagem1.png';
      default: return '/imagens/personagem1.png';
    }
  }
}
