import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonModule } from '@angular/common';

import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomTableComponent } from '@shared/components/custom-form/custom-table/custom-table.component';
import { CustomTableColumnComponent } from '@shared/components/custom-form/custom-table/custom-table-column.component';
import { CustomDialogComponent } from '@shared/components/custom-dialog/custom-dialog.component';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { LoadingService } from '@shared/components/custom-spinner/loading.service';
import { CustomSpinnerComponent } from '@shared/components/custom-spinner/custom-spinner.component';
import { FormErrorComponent } from '@shared/components/form-error/form-error.component';

import { UserService } from '../application/services/user.service';
import { UserRepositoryPort } from '../application/ports/user-repository.port';
import { MockUserRepository } from './test-utils';
import { USER_REPOSITORY_TOKEN } from '../infrastructure/providers/user-service.provider';
import { ApiService } from '@core/services/api/api.service';
import { CacheService } from '@core/services/cache/cache.service';
import { ApiErrorService } from '@core/services/error/api-error.service';

/**
 * Módulos comunes para pruebas de integración
 */
export const COMMON_TEST_MODULES = [
  CommonModule,
  ReactiveFormsModule,
  HttpClientTestingModule,
  RouterTestingModule,
  BrowserAnimationsModule
];

/**
 * Componentes comunes para pruebas de integración
 */
export const COMMON_TEST_COMPONENTS = [
  CustomButtonComponent,
  CustomFormFieldComponent,
  CustomCardComponent,
  CustomTableComponent,
  CustomTableColumnComponent,
  CustomDialogComponent,
  CustomSpinnerComponent,
  FormErrorComponent
];

/**
 * Proveedores para pruebas de integración con mock de repositorio
 */
export const MOCK_REPOSITORY_PROVIDERS = [
  { provide: USER_REPOSITORY_TOKEN, useClass: MockUserRepository },
  UserService,
  CustomDialogService,
  CustomNotificationService,
  LoadingService
];

/**
 * Proveedores para pruebas de integración con servicios reales
 */
export const REAL_SERVICE_PROVIDERS = [
  ApiService,
  CacheService,
  ApiErrorService,
  CustomDialogService,
  CustomNotificationService,
  LoadingService,
  UserService
];

/**
 * Clase base para pruebas de integración
 */
export class IntegrationTestBase {
  /**
   * Espera a que se completen las operaciones asíncronas
   */
  static waitForAsync(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Espera a que se completen las operaciones asíncronas y actualiza el fixture
   * @param fixture Fixture del componente
   */
  static async waitForFixtureToBeStable(fixture: { detectChanges: () => void }): Promise<void> {
    await this.waitForAsync();
    fixture.detectChanges();
    await this.waitForAsync();
    fixture.detectChanges();
  }

  /**
   * Simula un clic en un elemento
   * @param element Elemento a hacer clic
   */
  static click(element: HTMLElement): void {
    element.click();
  }

  /**
   * Simula la entrada de texto en un campo
   * @param element Elemento de entrada
   * @param value Valor a ingresar
   */
  static setInputValue(element: HTMLInputElement, value: string): void {
    element.value = value;
    element.dispatchEvent(new Event('input'));
    element.dispatchEvent(new Event('change'));
    element.dispatchEvent(new Event('blur'));
  }

  /**
   * Simula la selección de una opción en un select
   * @param element Elemento select
   * @param value Valor a seleccionar
   */
  static setSelectValue(element: HTMLSelectElement, value: string): void {
    element.value = value;
    element.dispatchEvent(new Event('change'));
  }

  /**
   * Simula el envío de un formulario
   * @param element Elemento de formulario
   */
  static submitForm(element: HTMLFormElement): void {
    element.dispatchEvent(new Event('submit'));
  }

  /**
   * Obtiene un elemento por selector
   * @param fixture Fixture del componente
   * @param selector Selector CSS
   * @returns Elemento encontrado o null
   */
  static queryElement<T extends HTMLElement>(fixture: { nativeElement: Element }, selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  /**
   * Obtiene todos los elementos que coinciden con un selector
   * @param fixture Fixture del componente
   * @param selector Selector CSS
   * @returns Lista de elementos encontrados
   */
  static queryAllElements<T extends HTMLElement>(fixture: { nativeElement: Element }, selector: string): T[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector)) as T[];
  }

  /**
   * Espera a que aparezca un elemento en el DOM
   * @param fixture Fixture del componente
   * @param selector Selector CSS
   * @param timeout Tiempo máximo de espera en ms
   * @returns Promesa que se resuelve con el elemento o se rechaza si no aparece
   */
  static async waitForElement<T extends HTMLElement>(
    fixture: { detectChanges: () => void; nativeElement: Element },
    selector: string,
    timeout = 2000
  ): Promise<T> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = this.queryElement<T>(fixture, selector);

      if (element) {
        return element;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();
    }

    throw new Error(`Element with selector "${selector}" not found within ${timeout}ms`);
  }
}
