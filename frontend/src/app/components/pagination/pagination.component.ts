import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
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
