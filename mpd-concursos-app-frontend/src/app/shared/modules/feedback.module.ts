import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Componentes

import { ContextualHelpComponent } from '../components/contextual-help/contextual-help.component';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';

import { LoadingIndicatorComponent } from '../components/loading-indicator/loading-indicator.component';

import { PageTransitionComponent } from '../components/page-transition/page-transition.component';

// Directivas
import { AnimateDirective } from '../directives/animate.directive';
import { TooltipDirective } from '../directives/tooltip.directive';

// Servicios
import { AnimationService } from '../services/animation.service';
import { FeedbackService } from '../services/feedback.service';
import { HelpService } from '../services/help.service';
import { ConfirmationService } from '../services/confirmation.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    OverlayModule,
    PortalModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,

    // Directivas
    AnimateDirective,
    TooltipDirective
  ],
  exports: [
    // Directivas
    AnimateDirective,
    TooltipDirective
  ],
  providers: [
    AnimationService,
    FeedbackService,
    HelpService,
    ConfirmationService
  ]
})
export class FeedbackModule { }
