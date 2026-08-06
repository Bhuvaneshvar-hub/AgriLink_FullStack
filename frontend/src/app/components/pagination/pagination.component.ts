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
          <!-- Selection is marked per-option rather than with [value] on the select:
               a select's value assignment is discarded while it still has no
               options, which left the control showing sizeOptions[0] regardless of
               the real pageSize - and then picking that first size fired no change
               event, so it looked dead. -->
          <select (change)="onPageSizeChange($event)" aria-label="Rows per page">
            @for (size of sizeOptions; track size) {
              <option [value]="size" [selected]="size === pageSize">{{ size }}</option>
            }
          </select>
        </div>

        <div class="pagination-buttons">
          <button [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">
            <i class="material-icons-round">chevron_left</i>
          </button>
          
          <!-- Tracked by position, not value: a page range with a window in the
               middle carries the -1 ellipsis sentinel twice ("1 ... 4 5 6 ... 9"),
               and tracking by value would make those two entries duplicate keys. -->
          @for (page of pages; track $index) {
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
  @Input() sizeOptions = [3, 5, 10, 20, 50];

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

  /**
   * Builds the page buttons: always the first and last page, plus a window around
   * the current one. Gaps are bridged with an ellipsis, except a gap of exactly one
   * page, where the number itself is shown rather than hiding a single page behind
   * "..." (which read as though pages were missing).
   */
  private generatePageRange(): void {
    const current = this.currentPage;
    const total = this.totalPages;

    if (total <= 0) {
      this.pages = [];
      return;
    }
    // Few enough to list in full — no ellipsis needed.
    if (total <= 7) {
      this.pages = Array.from({ length: total }, (_, i) => i);
      return;
    }

    const window = new Set<number>([0, total - 1]);
    for (const page of [current - 1, current, current + 1]) {
      if (page >= 0 && page <= total - 1) {
        window.add(page);
      }
    }

    const pages: number[] = [];
    let previous: number | null = null;
    for (const page of [...window].sort((a, b) => a - b)) {
      if (previous !== null) {
        const gap = page - previous;
        if (gap === 2) {
          pages.push(previous + 1); // a lone page: show it instead of an ellipsis
        } else if (gap > 2) {
          pages.push(-1);
        }
      }
      pages.push(page);
      previous = page;
    }
    this.pages = pages;
  }
}
