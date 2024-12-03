import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PostulacionDetalleComponent } from '../postulacion-detalle/postulacion-detalle.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { PostulacionesService } from '@core/services/postulaciones/postulaciones.service';

@Component({
  selector: 'app-postulacion-detalle-pagina',
  templateUrl: './postulacion-detalle-pagina.component.html',
  styleUrls: ['./postulacion-detalle-pagina.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    PostulacionDetalleComponent, 
    MatProgressSpinnerModule,
    MatIconModule
  ]
})
export class PostulacionDetallePaginaComponent implements OnInit {
  postulacion: any;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postulacionesService: PostulacionesService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarPostulacion(Number(id));
    } else {
      this.error = 'ID de postulación no encontrado';
      this.loading = false;
    }
  }

  private cargarPostulacion(id: number) {
    this.postulacionesService.getPostulacion(id).subscribe({
      next: (data) => {
        this.postulacion = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar la postulación';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  onCerrar() {
    this.router.navigate(['/postulaciones']);
  }
}
