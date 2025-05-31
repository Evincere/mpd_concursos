import { Pipe, PipeTransform } from '@angular/core';
import { ReportField } from '@core/services/admin/admin-reports.service';

@Pipe({
  name: 'filterByGroup',
  standalone: true
})
export class FilterByGroupPipe implements PipeTransform {
  transform(fields: ReportField[], group: string): ReportField[] {
    if (!fields || !group) {
      return [];
    }
    
    return fields.filter(field => field.group === group);
  }
}
