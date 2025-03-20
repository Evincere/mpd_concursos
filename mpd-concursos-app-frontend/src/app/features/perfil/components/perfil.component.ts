import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {

  perfilForm: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.perfilForm = this.fb.group({
      fechas: this.fb.array([])
    });
  }

  agregarFecha(): void {
    console.debug('===== INICIO agregarFecha() - versión simplificada =====');

    // Creamos directamente un FormGroup simple con todos los campos necesarios
    const formGroup = this.fb.group({
      fecha: [null, Validators.required],
      descripcion: ['', Validators.required],
      documentoId: [null]
    });

    // Agregamos el grupo al FormArray directamente
    (this.perfilForm.get('fechas') as FormArray).push(formGroup);

    console.debug('===== FIN agregarFecha() - formGroup agregado =====');

    // Hacemos scroll al nuevo elemento usando setTimeout para asegurar que el DOM se ha actualizado
    setTimeout(() => {
      try {
        const elements = document.querySelectorAll('.cv-item');
        if (elements && elements.length > 0) {
          const lastElement = elements[elements.length - 1];
          lastElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          console.debug('Scroll realizado al nuevo elemento de fecha');
        }
      } catch (e) {
        console.error('Error al hacer scroll:', e);
      }
    }, 100);
  }

  // Simplificamos también el método createFechaFormGroup
  createFechaFormGroup(fecha?: any): FormGroup {
    console.debug('Creando grupo de fecha simple');

    return this.fb.group({
      fecha: [fecha?.fecha || null, Validators.required],
      descripcion: [fecha?.descripcion || '', Validators.required],
      documentoId: [fecha?.documentoId || null]
    });
  }
}
