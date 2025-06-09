import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Tipo de anuncio para lectores de pantalla
 */
export enum AnnouncementType {
  /**
   * Anuncio polite (no interrumpe la lectura actual)
   */
  POLITE = 'polite',
  
  /**
   * Anuncio assertive (interrumpe la lectura actual)
   */
  ASSERTIVE = 'assertive'
}

/**
 * Servicio para gestionar anuncios para lectores de pantalla
 */
@Injectable({
  providedIn: 'root'
})
export class ScreenReaderService {
  /**
   * Elemento para anuncios polite
   */
  private politeElement: HTMLElement;
  
  /**
   * Elemento para anuncios assertive
   */
  private assertiveElement: HTMLElement;
  
  /**
   * Renderer
   */
  private renderer: Renderer2;

  /**
   * Constructor
   * @param rendererFactory Factory de renderer
   * @param document Documento
   */
  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    
    // Crear elementos para anuncios
    this.politeElement = this.createAnnouncementElement(AnnouncementType.POLITE);
    this.assertiveElement = this.createAnnouncementElement(AnnouncementType.ASSERTIVE);
    
    // Añadir elementos al DOM
    this.document.body.appendChild(this.politeElement);
    this.document.body.appendChild(this.assertiveElement);
  }

  /**
   * Anuncia un mensaje para lectores de pantalla
   * @param message Mensaje a anunciar
   * @param type Tipo de anuncio
   */
  announce(message: string, type: AnnouncementType = AnnouncementType.POLITE): void {
    const element = type === AnnouncementType.POLITE ? this.politeElement : this.assertiveElement;
    
    // Limpiar el elemento
    this.renderer.setProperty(element, 'textContent', '');
    
    // Añadir el mensaje después de un breve retraso para asegurar que se anuncie
    setTimeout(() => {
      this.renderer.setProperty(element, 'textContent', message);
    }, 50);
  }

  /**
   * Anuncia un mensaje polite
   * @param message Mensaje a anunciar
   */
  announcePolite(message: string): void {
    this.announce(message, AnnouncementType.POLITE);
  }

  /**
   * Anuncia un mensaje assertive
   * @param message Mensaje a anunciar
   */
  announceAssertive(message: string): void {
    this.announce(message, AnnouncementType.ASSERTIVE);
  }

  /**
   * Crea un elemento para anuncios
   * @param type Tipo de anuncio
   * @returns Elemento para anuncios
   */
  private createAnnouncementElement(type: AnnouncementType): HTMLElement {
    const element = this.renderer.createElement('div');
    
    // Configurar atributos ARIA
    this.renderer.setAttribute(element, 'aria-live', type);
    this.renderer.setAttribute(element, 'aria-atomic', 'true');
    
    // Ocultar visualmente el elemento pero mantenerlo accesible para lectores de pantalla
    this.renderer.setStyle(element, 'position', 'absolute');
    this.renderer.setStyle(element, 'width', '1px');
    this.renderer.setStyle(element, 'height', '1px');
    this.renderer.setStyle(element, 'margin', '-1px');
    this.renderer.setStyle(element, 'padding', '0');
    this.renderer.setStyle(element, 'overflow', 'hidden');
    this.renderer.setStyle(element, 'clip', 'rect(0, 0, 0, 0)');
    this.renderer.setStyle(element, 'white-space', 'nowrap');
    this.renderer.setStyle(element, 'border', '0');
    
    return element;
  }
}
