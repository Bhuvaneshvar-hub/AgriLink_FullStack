import { Component, signal, HostListener, ChangeDetectionStrategy } from '@angular/core';

/**
 * Reusable overflow (three-dot) action menu.
 *
 * Usage — project the row's action buttons as `.menu-item` elements:
 *
 *   <app-action-menu>
 *     <button class="menu-item" (click)="edit(row)">
 *       <i class="material-icons-round">edit</i> Edit
 *     </button>
 *     <button class="menu-item danger" (click)="delete(row)">
 *       <i class="material-icons-round">delete</i> Delete
 *     </button>
 *   </app-action-menu>
 *
 * The panel is fixed-positioned (so it is never clipped by table overflow) and
 * closes on item click, outside click, Escape, or scroll/resize.
 */
@Component({
  selector: 'app-action-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './action-menu.component.html',
  styleUrls: ['./action-menu.component.css']
})
export class ActionMenuComponent {
  readonly open = signal(false);
  readonly panelTop = signal(0);
  readonly panelLeft = signal(0);

  private readonly panelWidth = 190;

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.open()) {
      this.close();
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    let left = rect.right - this.panelWidth;
    if (left < 8) left = 8;
    this.panelLeft.set(left);
    this.panelTop.set(rect.bottom + 6);
    this.open.set(true);
  }

  close(): void {
    if (this.open()) this.open.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void { this.close(); }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.close(); }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void { this.close(); }
}
