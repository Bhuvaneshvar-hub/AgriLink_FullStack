import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DetailRow {
  label: string;
  value: any;
}

/**
 * Reusable "View Details" popup. Renders a record as a read-only list of
 * label/value pairs. Callers build the rows (already formatted) and pass a title.
 *
 *   <app-detail-modal
 *     [title]="detailTitle()"
 *     [rows]="detailRows()"
 *     (close)="showDetailModal.set(false)">
 *   </app-detail-modal>
 */
@Component({
  selector: 'app-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-content detail-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" (click)="close.emit()">
            <i class="material-icons-round">close</i>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            @for (row of rows; track row.label) {
              <div class="detail-item">
                <span class="detail-label">{{ row.label }}</span>
                <span class="detail-value">{{ (row.value === null || row.value === undefined || row.value === '') ? '—' : row.value }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem 1.5rem;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }
    .detail-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .detail-value {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text-primary);
      word-break: break-word;
    }
    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
      display: inline-flex;
    }
    .close-btn:hover { color: var(--text-primary); }
  `]
})
export class DetailModalComponent {
  @Input() title = 'Details';
  @Input() rows: DetailRow[] = [];
  @Output() close = new EventEmitter<void>();
}
