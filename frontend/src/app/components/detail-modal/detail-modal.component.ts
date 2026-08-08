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
  templateUrl: './detail-modal.component.html',
  styleUrls: ['./detail-modal.component.css']
})
export class DetailModalComponent {
  @Input() title = 'Details';
  @Input() rows: DetailRow[] = [];
  @Output() close = new EventEmitter<void>();
}
