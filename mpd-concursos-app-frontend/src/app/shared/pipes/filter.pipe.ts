import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(items: unknown[], property: string, value: unknown, returnFirst = false): unknown[] {
    if (!items || !property || value === undefined) {
      return items;
    }

    const filteredItems = items.filter(item => {
      const itemObj = item as Record<string, unknown>;
      if (item && typeof item === "object" && property in itemObj && typeof itemObj[property] === "string" && typeof value === "string") {
        return (itemObj[property] as string).toLowerCase().includes(value.toLowerCase());
      }
      return itemObj[property] === value;
    });

    return returnFirst ? (filteredItems.length > 0 ? [filteredItems[0]] : []) : filteredItems;
  }
}

@Pipe({
  name: 'first',
  standalone: true
})
export class FirstPipe implements PipeTransform {
  transform(items: unknown[]): unknown {
    return items && items.length > 0 ? items[0] : null;
  }
}

@Pipe({
  name: 'property',
  standalone: true
})
export class PropertyPipe implements PipeTransform {
  transform(item: unknown, property: string): unknown {
    const itemObj = item as Record<string, unknown>;
    return item && property && typeof item === "object" && property in itemObj ? itemObj[property] : null;
  }
}
