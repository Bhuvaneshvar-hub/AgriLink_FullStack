import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination-wrapper">
      <div class="pagination-info">
        Showing <span>{{ startItem }}</span> to <span>{{ endItem }}</span> of <span>{{ totalElements }}</span> entries
      </div>
      
      <div class="pagination-controls">
        <div class="page-size-selector">
          <label>Show</label>
          <select [value]="pageSize" (change)="onPageSizeChange($event)">
            @for (size of sizeOptions; track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
        </div>

        <div class="pagination-buttons">
          <button [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">
            <i class="material-icons-round">chevron_left</i>
          </button>
          
          @for (page of pages; track page) {
            @if (page === -1) {
              <span class="pagination-ellipsis">...</span>
            } @else {
              <button 
                [class.active]="currentPage === page" 
                (click)="goToPage(page)">
                {{ page + 1 }}
              </button>
            }
          }

          <button [disabled]="currentPage >= totalPages - 1" (click)="goToPage(currentPage + 1)">
            <i class="material-icons-round">chevron_right</i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pagination-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: 1rem;
    }
    .pagination-info {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .pagination-info span {
      font-weight: 600;
      color: var(--text-primary);
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .page-size-selector select {
      padding: 0.25rem 0.5rem;
      border-radius: 0.35rem;
      background-color: var(--bg-dark);
      border-color: var(--border-color);
    }
    .pagination-buttons {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .pagination-buttons button {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      border-radius: 0.375rem;
      border: 1px solid var(--border-color);
      background-color: transparent;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .pagination-buttons button:hover:not(:disabled) {
      border-color: var(--primary-color);
      color: var(--text-primary);
      background-color: var(--primary-light);
    }
    .pagination-buttons button.active {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
      color: #ffffff;
      font-weight: 600;
    }
    .pagination-buttons button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .pagination-buttons button i {
      font-size: 18px;
    }
    .pagination-ellipsis {
      color: var(--text-muted);
      padding: 0 0.25rem;
    }
  `]
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 0;
  @Input() pageSize = 10;
  @Input() totalElements = 0;
  @Input() sizeOptions = [5, 10, 20, 50];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  totalPages = 0;
  pages: number[] = [];

  ngOnChanges(): void {
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    this.generatePageRange();
  }

  get startItem(): number {
    if (this.totalElements === 0) return 0;
    return this.currentPage * this.pageSize + 1;
  }

  get endItem(): number {
    const end = (this.currentPage + 1) * this.pageSize;
    return end > this.totalElements ? this.totalElements : end;
  }

  onPageSizeChange(event: Event): void {
    const size = parseInt((event.target as HTMLSelectElement).value, 10);
    this.pageSizeChange.emit(size);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  private generatePageRange(): void {
    const current = this.currentPage;
    const total = this.totalPages;
    
    if (total <= 5) {
      this.pages = Array.from({ length: total }, (_, i) => i);
      return;
    }

    const pages: number[] = [];
    pages.push(0);

    if (current > 2) {
      pages.push(-1); // Ellipsis
    }

    const start = Math.max(1, current - 1);
    const end = Math.min(total - 2, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 3) {
      pages.push(-1); // Ellipsis
    }

    pages.push(total - 1);
    this.pages = pages;
  }
}
