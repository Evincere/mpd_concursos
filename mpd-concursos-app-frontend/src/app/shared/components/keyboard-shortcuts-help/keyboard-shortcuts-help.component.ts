import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { KeyboardShortcutsService, KeyboardShortcut } from '../../services/keyboard-shortcuts.service';
import { CustomButtonComponent } from '../custom-form/custom-button/custom-button.component';

/**
 * Componente para mostrar los atajos de teclado disponibles en la aplicación.
 */
@Component({
  selector: 'app-keyboard-shortcuts-help',
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent
  ],
  template: `
    <div class="shortcuts-help-overlay" *ngIf="isVisible" [@fadeAnimation]>
      <div class="shortcuts-help-dialog" [@slideAnimation]>
        <div class="dialog-header">
          <h2>Atajos de Teclado</h2>
          <app-custom-button
            [variant]="'icon'"
            [icon]="'times'"
            [color]="'primary'"
            (buttonClick)="close()">
          </app-custom-button>
        </div>
        
        <div class="dialog-content">
          <div class="shortcuts-section">
            <h3>Atajos Globales</h3>
            <div class="shortcuts-list">
              <div class="shortcut-item" *ngFor="let shortcut of globalShortcuts">
                <div class="shortcut-keys">
                  <kbd *ngFor="let key of getShortcutKeys(shortcut)">{{key}}</kbd>
                </div>
                <div class="shortcut-description">
                  {{shortcut.description}}
                </div>
              </div>
            </div>
          </div>
          
          <div class="shortcuts-section" *ngIf="contextualShortcuts.length > 0">
            <h3>Atajos Contextuales</h3>
            <div class="shortcuts-list">
              <div class="shortcut-item" *ngFor="let shortcut of contextualShortcuts">
                <div class="shortcut-keys">
                  <kbd *ngFor="let key of getShortcutKeys(shortcut)">{{key}}</kbd>
                </div>
                <div class="shortcut-description">
                  {{shortcut.description}}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dialog-footer">
          <p class="help-tip">
            Presiona <kbd>?</kbd> en cualquier momento para mostrar esta ayuda.
          </p>
          <app-custom-button
            [label]="'Cerrar'"
            [variant]="'flat'"
            [color]="'primary'"
            (buttonClick)="close()">
          </app-custom-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'src/styles/variables' as *;
    
    .shortcuts-help-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    
    .shortcuts-help-dialog {
      background-color: $color-surface;
      border-radius: $border-radius;
      box-shadow: $box-shadow;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid $color-border;
      
      h2 {
        margin: 0;
        font-size: $font-size-lg;
        font-weight: 500;
        color: $color-text-primary;
      }
    }
    
    .dialog-content {
      padding: 1rem;
      overflow-y: auto;
      flex: 1;
    }
    
    .shortcuts-section {
      margin-bottom: 1.5rem;
      
      h3 {
        font-size: $font-size-md;
        font-weight: 500;
        color: $color-text-primary;
        margin-top: 0;
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid $color-border;
      }
    }
    
    .shortcuts-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 0.75rem;
    }
    
    .shortcut-item {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      border-radius: $border-radius;
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: rgba($color-primary, 0.05);
      }
    }
    
    .shortcut-keys {
      display: flex;
      gap: 0.25rem;
      margin-right: 0.75rem;
      min-width: 100px;
    }
    
    kbd {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      font-size: $font-size-sm;
      font-family: monospace;
      line-height: 1;
      color: $color-text-primary;
      background-color: $color-surface-light;
      border: 1px solid $color-border;
      border-radius: 3px;
      box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
    }
    
    .shortcut-description {
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }
    
    .dialog-footer {
      padding: 1rem;
      border-top: 1px solid $color-border;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .help-tip {
      font-size: $font-size-sm;
      color: $color-text-tertiary;
      margin: 0;
    }
    
    // Estilos para tema oscuro
    @media (prefers-color-scheme: dark) {
      .shortcuts-help-dialog {
        background-color: $color-surface-dark;
      }
      
      .dialog-header {
        border-bottom-color: $color-border-dark;
        
        h2 {
          color: $color-text-primary-dark;
        }
      }
      
      .shortcuts-section h3 {
        color: $color-text-primary-dark;
        border-bottom-color: $color-border-dark;
      }
      
      .shortcut-item:hover {
        background-color: rgba($color-primary-dark, 0.1);
      }
      
      kbd {
        color: $color-text-primary-dark;
        background-color: $color-surface-light-dark;
        border-color: $color-border-dark;
      }
      
      .shortcut-description {
        color: $color-text-secondary-dark;
      }
      
      .dialog-footer {
        border-top-color: $color-border-dark;
      }
      
      .help-tip {
        color: $color-text-tertiary-dark;
      }
    }
  `],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(-20px)', opacity: 0 }))
      ])
    ])
  ]
})
export class KeyboardShortcutsHelpComponent implements OnInit {
  isVisible = false;
  shortcuts: KeyboardShortcut[] = [];
  globalShortcuts: KeyboardShortcut[] = [];
  contextualShortcuts: KeyboardShortcut[] = [];
  
  constructor(private keyboardShortcutsService: KeyboardShortcutsService) {}
  
  ngOnInit(): void {
    // Registrar atajo para mostrar/ocultar la ayuda
    this.keyboardShortcutsService.registerShortcut({
      key: '?',
      description: 'Mostrar/ocultar ayuda de atajos de teclado',
      global: true,
      action: () => {
        this.toggle();
      }
    });
  }
  
  /**
   * Muestra la ayuda de atajos de teclado
   */
  show(): void {
    this.isVisible = true;
    this.loadShortcuts();
  }
  
  /**
   * Oculta la ayuda de atajos de teclado
   */
  close(): void {
    this.isVisible = false;
  }
  
  /**
   * Alterna la visibilidad de la ayuda de atajos de teclado
   */
  toggle(): void {
    if (this.isVisible) {
      this.close();
    } else {
      this.show();
    }
  }
  
  /**
   * Obtiene las teclas de un atajo de teclado
   * @param shortcut Atajo de teclado
   * @returns Array de teclas
   */
  getShortcutKeys(shortcut: KeyboardShortcut): string[] {
    const keys = [];
    
    if (shortcut.ctrlKey) {
      keys.push('Ctrl');
    }
    
    if (shortcut.altKey) {
      keys.push('Alt');
    }
    
    if (shortcut.shiftKey) {
      keys.push('Shift');
    }
    
    keys.push(shortcut.key.toUpperCase());
    
    return keys;
  }
  
  /**
   * Carga los atajos de teclado disponibles
   */
  private loadShortcuts(): void {
    this.shortcuts = this.keyboardShortcutsService.getShortcuts();
    this.globalShortcuts = this.shortcuts.filter(s => s.global);
    this.contextualShortcuts = this.shortcuts.filter(s => !s.global);
  }
}
