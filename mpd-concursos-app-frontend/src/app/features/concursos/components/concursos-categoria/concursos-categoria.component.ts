import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoriaEnum } from '../../../../shared/constants/enums/categoria-enum';
import { Concurso } from '../../../../shared/interfaces/concurso/concurso.interface';

@Component({
  selector: 'app-concursos-categoria',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink
  ],
  templateUrl: './concursos-categoria.component.html',
  styleUrl: './concursos-categoria.component.scss'
})
export class ConcursosCategoriaComponent {
  @Input() categoria!: CategoriaEnum;
  @Input() concursos: Concurso[] = [];
}
