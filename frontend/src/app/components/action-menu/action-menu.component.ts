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
  template: `
    <div class="action-menu">
      <button type="button" class="action-menu-toggle" [class.active]="open()"
              (click)="toggle($event)" aria-haspopup="menu"
              [attr.aria-expanded]="open()" title="Actions">
        <i class="material-icons-round">more_vert</i>
      </button>
      @if (open()) {
        <div class="action-menu-panel" role="menu"
             [style.top.px]="panelTop()" [style.left.px]="panelLeft()"
             (click)="close()">
          <ng-content></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    .action-menu { display: inline-flex; }
    .action-menu-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 0.5rem;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .action-menu-toggle:hover,
    .action-menu-toggle.active {
      background: var(--primary-light);
      color: var(--primary-color);
      border-color: var(--border-color);
    }
    .action-menu-toggle i { font-size: 20px; }
    .action-menu-panel {
      position: fixed;
      z-index: 1200;
      min-width: 190px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 0.6rem;
      box-shadow: var(--shadow-lg);
      padding: 0.35rem;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      animation: amFade 0.12s ease-out;
    }
    @keyframes amFade {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: none; }
    }
  `]
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
