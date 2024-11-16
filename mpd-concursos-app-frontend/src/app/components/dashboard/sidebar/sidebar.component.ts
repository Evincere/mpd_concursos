import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  ngOnInit() {
    this.setupSubmenuToggle();
  }

  setupSubmenuToggle() {
    const submenuTriggers = document.querySelectorAll('.has-submenu');
    
    submenuTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            trigger.classList.toggle('active');
            const submenu = trigger.nextElementSibling as HTMLElement | null;
            if (submenu) {
                submenu.classList.toggle('show');
            }
        });
    });
  }
}
