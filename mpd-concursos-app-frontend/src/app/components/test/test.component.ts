import { Component, OnInit } from '@angular/core';
import { TestService } from '../../services/test.service';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [],
  templateUrl: './test.component.html',
  styleUrl: './test.component.scss'
})
export class TestComponent implements OnInit {
  
  message: string = '';

  constructor(private testService: TestService) { }

  ngOnInit(): void {
    this.testService.getTestMessage().subscribe({
      next: (data) => {
        this.message = data.message;
      },
      error: (error) => {
        console.error('Error al obtener el mensaje:', error);
      }
    });
  }
}
