import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReportService } from '../../../services/report.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../../components/detail-modal/detail-modal.component';
import { toggleSort, sortIcon as sortIconFn, applySort } from '../../../utils/table-sort.util';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  template: `
    <div class="report-dashboard-page">
      <div class="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>Analytics & Reporting</h1>
          <p class="text-secondary">Generate and review agricultural metric reports, yield logs, and financial scopes.</p>
        </div>
        
        @if (canGenerate()) {
          <div class="header-export-buttons">
            <button class="btn btn-secondary btn-icon-only" (click)="onExport('excel')" [disabled]="isExporting()" title="Export reports to Excel" aria-label="Export reports to Excel">
              <i class="material-icons-round text-success">table_view</i>
            </button>
            <button class="btn btn-secondary btn-icon-only" (click)="onExport('pdf')" [disabled]="isExporting()" style="margin-left: 0.5rem;" title="Export reports to PDF" aria-label="Export reports to PDF">
              <i class="material-icons-round text-danger">picture_as_pdf</i>
            </button>
          </div>
        }
      </div>

      <!-- Tab Navigation -->
      <div class="report-tabs">
        <button type="button" class="report-tab" [class.active]="activeTab() === 'analytics'" (click)="activeTab.set('analytics')">
          <i class="material-icons-round">insights</i>
          <span>Analytics</span>
        </button>
        @if (canGenerate()) {
          <button type="button" class="report-tab" [class.active]="activeTab() === 'generate'" (click)="activeTab.set('generate')">
            <i class="material-icons-round">analytics</i>
            <span>Generate Report</span>
          </button>
        }
        <button type="button" class="report-tab" [class.active]="activeTab() === 'history'" (click)="activeTab.set('history')">
          <i class="material-icons-round">history</i>
          <span>History Logs</span>
        </button>
      </div>

      <!-- Tab: Visual Analytics -->
      @if (activeTab() === 'analytics') {
      <div class="analytics-visuals mb-4">
        <!-- VCards Metrics Row -->
        <div class="metrics-row mb-4">
          <div class="metric-card">
            <div class="metric-icon subsidy">
              <i class="material-icons-round">payments</i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Total Subsidies Disbursed</span>
              <h2 class="metric-value subsidy">₹{{ totalSubsidiesDisbursed() | number:'1.0-0' }}</h2>
              <span class="metric-sub text-secondary"><i class="material-icons-round">account_balance</i> Across {{ schemeCount() }} scheme(s)</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon sales">
              <i class="material-icons-round">shopping_bag</i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Produce Market Sales</span>
              <h2 class="metric-value sales">₹{{ produceMarketSales() | number:'1.0-0' }}</h2>
              <span class="metric-sub text-secondary"><i class="material-icons-round">receipt_long</i> {{ salesCount() }} sale(s) recorded</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon crops">
              <i class="material-icons-round">eco</i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Total Sown Area</span>
              <h2 class="metric-value crops">{{ totalSownArea() | number:'1.0-1' }} Ac</h2>
              <span class="metric-sub text-secondary"><i class="material-icons-round">update</i> Across {{ seasonCount() }} season(s)</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon farmers">
              <i class="material-icons-round">people</i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Active Farmers Registered</span>
              <h2 class="metric-value farmers">{{ activeFarmers() }} Farmers</h2>
              <span class="metric-sub text-secondary"><i class="material-icons-round">place</i> Across {{ districtCount() }} district(s)</span>
            </div>
          </div>
        </div>

        <div class="charts-row">
          <!-- Monthly Financial Progress — real data: sales (/produce/salesTrend) + subsidies (/subsidy/disbursementTrend) -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Monthly Financial Progress (2026)</h3>
              <div class="chart-legend">
                <span class="legend-item"><span class="color-dot" style="background:#16a34a"></span>Sales (₹)</span>
                <span class="legend-item"><span class="color-dot" style="background:#3b82f6"></span>Subsidies (₹)</span>
              </div>
            </div>
            <div class="chart-container">
              @if (trendMonths().length) {
              <svg viewBox="-20 0 520 220" class="svg-chart">
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#16a34a" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#16a34a" stop-opacity="0.0"/>
                  </linearGradient>
                  <linearGradient id="subsidiesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>

                <!-- Grid + Y axis labels (computed) -->
                @for (yl of trendYLabels(); track yl.label) {
                  <line x1="40" [attr.y1]="yl.y" x2="480" [attr.y2]="yl.y" stroke="#f1f5f9" stroke-width="1"/>
                  <text x="35" [attr.y]="yl.y + 4" text-anchor="end" class="chart-text">{{ yl.label }}</text>
                }
                <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" stroke-width="1.5"/>

                <!-- X axis labels (months) -->
                @for (m of trendMonths(); track m.label) {
                  <text [attr.x]="m.x" y="190" text-anchor="middle" class="chart-text">{{ m.label }}</text>
                }

                <!-- Sales series (green) -->
                <path [attr.d]="salesAreaPath()" fill="url(#salesGrad)"/>
                <path [attr.d]="salesPath()" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                @for (p of salesPts(); track $index) {
                  <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>
                }

                <!-- Subsidies series (blue) -->
                <path [attr.d]="subsidyAreaPath()" fill="url(#subsidiesGrad)"/>
                <path [attr.d]="subsidyPath()" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                @for (p of subsidyPts(); track $index) {
                  <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
                }

                <text x="260" y="215" text-anchor="middle" class="chart-axis-title">Month (2026)</text>
                <text x="-8" y="95" text-anchor="middle" transform="rotate(-90 -8 95)" class="chart-axis-title">Amount (₹)</text>
              </svg>
              } @else {
                <p class="text-secondary" style="padding:2rem;text-align:center;">No financial data yet.</p>
              }
            </div>
          </div>

          <!-- Sown Area by Season — real data from /dashboard/cropCoverage -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Sown Area by Season (Acres)</h3>
              <div class="chart-legend">
                @for (b of seasonBars(); track b.label) {
                  <span class="legend-item"><span class="color-dot" [style.background]="b.color"></span>{{ b.label }}</span>
                }
              </div>
            </div>
            <div class="chart-container">
              @if (seasonBars().length) {
              <svg viewBox="-20 0 520 220" class="svg-chart">
                <!-- Grid + Y axis labels (computed) -->
                @for (yl of seasonYLabels(); track yl.label) {
                  <line x1="40" [attr.y1]="yl.y" x2="480" [attr.y2]="yl.y" stroke="#f1f5f9" stroke-width="1"/>
                  <text x="35" [attr.y]="yl.y + 4" text-anchor="end" class="chart-text">{{ yl.label }}</text>
                }
                <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" stroke-width="1.5"/>

                <!-- Bars + value + season labels -->
                @for (b of seasonBars(); track b.label) {
                  <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.width" [attr.height]="b.height" rx="4" [attr.fill]="b.color" class="svg-bar"/>
                  <text [attr.x]="b.x + b.width / 2" [attr.y]="b.y - 8" text-anchor="middle" font-weight="600" font-size="11" fill="#475569">{{ b.value | number:'1.0-1' }} Ac</text>
                  <text [attr.x]="b.x + b.width / 2" y="190" text-anchor="middle" class="chart-text">{{ b.label }}</text>
                }

                <text x="260" y="215" text-anchor="middle" class="chart-axis-title">Season</text>
                <text x="-8" y="95" text-anchor="middle" transform="rotate(-90 -8 95)" class="chart-axis-title">Area (Acres)</text>
              </svg>
              } @else {
                <p class="text-secondary" style="padding:2rem;text-align:center;">No crop coverage data yet.</p>
              }
            </div>
          </div>
        </div>
      </div>
      }

      <!-- Tab: Generate Custom Report -->
      @if (canGenerate() && activeTab() === 'generate') {
          <div class="card form-card">
            <div class="card-header">
              <h3>Generate Custom Report</h3>
            </div>
            <form [formGroup]="reportForm" (ngSubmit)="onGenerate()" class="mt-3">
              <div class="form-group">
                <label for="scope">Report Scope</label>
                <select id="scope" formControlName="scope">
                  <option value="" disabled>Select scope...</option>
                  <option value="Farmer">Farmer Overview</option>
                  <option value="Crop">Crop Yield Analysis</option>
                  <option value="Region">Regional Subsidies</option>
                  <option value="Overall">Overall Portal Audit</option>
                </select>
                @if (isFieldInvalid('scope')) {
                  <span class="error-text">Scope selection is required</span>
                }
              </div>

              <div class="form-group">
                <label>Target Metrics</label>
                <div class="metrics-checkboxes">
                  <label class="checkbox-label">
                    <input type="checkbox" (change)="toggleMetric('yield')" [checked]="selectedMetrics.has('yield')" />
                    <span>Crop Yield Metrics</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" (change)="toggleMetric('subsidies')" [checked]="selectedMetrics.has('subsidies')" />
                    <span>Subsidies & Disbursements</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" (change)="toggleMetric('activities')" [checked]="selectedMetrics.has('activities')" />
                    <span>User Activity Count</span>
                  </label>
                </div>
                @if (metricError()) {
                  <span class="error-text">At least one metric must be selected</span>
                }
              </div>

              <button type="submit" class="btn btn-primary w-100 mt-3" [disabled]="reportForm.invalid || selectedMetrics.size === 0" title="Generate report">
                <i class="material-icons-round">analytics</i>
                <span>Generate Report</span>
              </button>
            </form>
          </div>
      }

      <!-- Tab: Report History Logs -->
      @if (activeTab() === 'history') {
        <div class="card list-card full-width">
          <div class="card-header">
            <h3>Report History Logs</h3>
          </div>
          
          <div class="filter-bar mt-2 mb-3">
            <div class="form-group">
              <label for="scopeFilter">Filter by Scope</label>
              <select id="scopeFilter" [(ngModel)]="scopeFilter" (ngModelChange)="applyFilters()">
                <option value="">All Scopes</option>
                <option value="Farmer">Farmer</option>
                <option value="Crop">Crop</option>
                <option value="Region">Region</option>
                <option value="Overall">Overall</option>
              </select>
            </div>
          </div>

          @if (isLoading()) {
            <div class="empty-state">
              <span class="spinner-large"></span>
              <p class="mt-3">Loading reports...</p>
            </div>
          } @else if (filteredReports().length === 0) {
            <div class="empty-state">
              <i class="material-icons-round">description</i>
              <h3>No Reports Logged</h3>
              <p>No analytics reports have been generated yet.</p>
            </div>
          } @else {
            <div class="table-container">
              <div class="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Scope</th>
                      <th>Metrics</th>
                      <th>Generated By</th>
                      <th class="sortable" (click)="sortBy('generatedDate')" title="Sort by date (click again to reverse)">
                        <span>Date</span>
                        <i class="material-icons-round sort-icon" [class.active]="sortField() === 'generatedDate'">{{ sortIcon(sortField() === 'generatedDate', sortAsc()) }}</i>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (report of paginatedReports(); track report.reportId) {
                      <tr>
                        <td>{{ report.reportId }}</td>
                        <td><span class="scope-label" [ngClass]="report.scope?.toLowerCase()">{{ report.scope }}</span></td>
                        <td>{{ report.metrics }}</td>
                        <td>User #{{ report.generatedBy }}</td>
                        <td>{{ report.generatedDate | date:'mediumDate' }}</td>
                        <td>
                          <app-action-menu>
                            <button class="menu-item" (click)="viewReportDetails(report)" title="View report details">
                              <i class="material-icons-round">visibility</i> View
                            </button>
                            @if (canGenerate()) {
                              <button class="menu-item danger" (click)="confirmDelete(report)" title="Delete report">
                                <i class="material-icons-round">delete</i> Delete
                              </button>
                            }
                          </app-action-menu>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <app-pagination
                [currentPage]="currentPage"
                [pageSize]="pageSize"
                [totalElements]="filteredReports().length"
                (pageChange)="onPageChange($event)"
                (pageSizeChange)="onPageSizeChange($event)">
              </app-pagination>
            </div>
          }
        </div>
      }

      <!-- Delete Confirmation -->
      @if (showDeleteConfirm()) {
        <app-confirmation-modal
          title="Delete Report Record"
          [message]="'Are you sure you want to delete report record #' + selectedReport()?.reportId + '?'"
          confirmText="Delete"
          cancelText="Cancel"
          (confirm)="onDelete()"
          (cancel)="closeDeleteConfirm()">
        </app-confirmation-modal>
      }

      @if (showDetailModal()) {
        <app-detail-modal
          [title]="detailTitle()"
          [rows]="detailRows()"
          (close)="showDetailModal.set(false)">
        </app-detail-modal>
      }
    </div>
  `,
  styles: [`
    /* Icon-only export buttons: square, centred icon (label moved to tooltip) */
    .btn-icon-only {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      width: 2.5rem;
      height: 2.5rem;
    }
    .btn-icon-only i {
      margin: 0;
    }

    /* Tab navigation */
    .report-tabs {
      display: flex;
      gap: 0.25rem;
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }
    .report-tab {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.65rem 1.1rem;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color var(--transition-fast), border-color var(--transition-fast);
    }
    .report-tab:hover { color: var(--text-primary); }
    .report-tab.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }
    .report-tab i { font-size: 1.1rem; }

    /* Keep the form a constant height: validation messages overlay a reserved
       slot below each field instead of pushing the layout taller. */
    form .form-group {
      position: relative;
      margin-bottom: 1.75rem;
    }
    form .error-text {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 0.15rem;
      line-height: 1.15;
    }
    .grid-layout {
      display: flex;
      flex-direction: row;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .form-card {
      flex: 1 1 320px;
    }
    .list-card {
      flex: 2 1 500px;
    }
    .list-card.full-width {
      flex: 1 1 100%;
    }
    .metrics-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
      color: var(--text-primary);
    }
    .checkbox-label input {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    .scope-label {
      background-color: var(--border-color);
      color: var(--text-primary);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .scope-label.farmer { background-color: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .scope-label.crop { background-color: rgba(22, 163, 74, 0.15); color: #16a34a; }
    .scope-label.region { background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .scope-label.overall { background-color: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
    
    .spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border-color);
      border-top: 4px solid var(--primary-color);
      border-radius: 50%;
      display: inline-block;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Visual Analytics Styles */
    .analytics-visuals {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .metric-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .metric-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .metric-icon i {
      font-size: 1.5rem;
    }
    .metric-icon.subsidy { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .metric-icon.sales { background-color: rgba(22, 163, 74, 0.1); color: #16a34a; }
    .metric-icon.crops { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .metric-icon.farmers { background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    
    .metric-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .metric-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .metric-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    /* Colour each metric to match its icon / the graph palette */
    .metric-value.subsidy { color: #3b82f6; }
    .metric-value.sales   { color: #16a34a; }
    .metric-value.crops   { color: #f59e0b; }
    .metric-value.farmers { color: #8b5cf6; }
    .metric-sub {
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 500;
    }
    .metric-sub i {
      font-size: 0.85rem;
    }
    
    .charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }
    .chart-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .chart-header h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .chart-legend {
      display: flex;
      gap: 0.75rem;
    }
    .legend-item {
      font-size: 0.75rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .color-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }
    .color-dot.sales { background-color: #16a34a; }
    .color-dot.subsidies { background-color: #3b82f6; }
    .color-dot.paddy { background-color: #16a34a; }
    .color-dot.wheat { background-color: #f59e0b; }
    .color-dot.cotton { background-color: #3b82f6; }
    .color-dot.groundnut { background-color: #a855f7; }

    .chart-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .svg-chart {
      width: 100%;
      height: auto;
      display: block;
    }
    .chart-text {
      font-size: 10px;
      fill: var(--text-secondary);
      font-family: inherit;
    }
    .chart-axis-title {
      font-size: 11px;
      font-weight: 600;
      fill: var(--text-secondary);
      font-family: inherit;
    }
    .svg-bar {
      transition: fill 0.2s ease;
      cursor: pointer;
    }
    .svg-bar:hover {
      fill-opacity: 0.85;
    }
  `]
})
export class ReportDashboardComponent implements OnInit {
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // States
  reports = signal<any[]>([]);
  filteredReports = signal<any[]>([]);
  isLoading = signal(true);
  isExporting = signal(false);

  // Active tab: 'analytics' (graphs) | 'generate' (custom report) | 'history' (logs).
  // Splitting the page into tabs keeps each view short and avoids page scrolling.
  activeTab = signal<'analytics' | 'generate' | 'history'>('analytics');
  
  // Selection
  selectedMetrics = new Set<string>(['yield']);
  metricError = signal(false);
  
  // Filters
  scopeFilter = '';
  
  // Modals
  showDeleteConfirm = signal(false);
  selectedReport = signal<any | null>(null);

  // Detail (view) modal
  showDetailModal = signal<boolean>(false);
  detailTitle = signal<string>('');
  detailRows = signal<DetailRow[]>([]);

  // Pagination — remember the chosen page size across navigation.
  currentPage = 0;
  pageSize = Number(localStorage.getItem('agrilink.tablePageSize')) || 10;

  // Column sorting for the report history table.
  sortField = signal<string | null>(null);
  sortAsc = signal(true);
  readonly sortIcon = sortIconFn;

  // Form
  reportForm!: FormGroup;

  // ── Live analytics (Analytics tab) — all values below are fetched from
  // the backend analytics endpoints, which aggregate real data on each call.
  analyticsLoading = signal(true);
  analyticsError = signal(false);
  totalSubsidiesDisbursed = signal(0);
  schemeCount = signal(0);
  produceMarketSales = signal(0);
  salesCount = signal(0);
  totalSownArea = signal(0);
  seasonCount = signal(0);
  activeFarmers = signal(0);
  districtCount = signal(0);

  // Chart 1 — monthly financial progress: Sales + Subsidies (two lines),
  // computed geometry over a shared, merged month axis.
  trendMonths = signal<{ x: number; label: string }[]>([]);
  trendYLabels = signal<{ y: number; label: string }[]>([]);
  subsidyPts = signal<{ x: number; y: number }[]>([]);
  subsidyPath = signal('');
  subsidyAreaPath = signal('');
  salesPts = signal<{ x: number; y: number }[]>([]);
  salesPath = signal('');
  salesAreaPath = signal('');

  // Chart 2 — sown area by season (bars), computed geometry.
  seasonBars = signal<{ x: number; y: number; height: number; width: number; label: string; value: number; color: string }[]>([]);
  seasonYLabels = signal<{ y: number; label: string }[]>([]);

  ngOnInit(): void {
    this.loadReports();
    this.loadAnalytics();
    this.initForm();
  }

  // Pull every card + chart dataset in parallel from the live analytics API.
  loadAnalytics(): void {
    this.analyticsLoading.set(true);
    this.analyticsError.set(false);
    forkJoin({
      utilisation: this.reportService.getUtilisationByScheme(),
      sales: this.reportService.getProduceSalesSummary(),
      coverage: this.reportService.getCropCoverage(),
      farmers: this.reportService.getRegistrationSummary(),
      trend: this.reportService.getDisbursementTrend(),
      salesTrend: this.reportService.getSalesTrend()
    }).subscribe({
      next: (r) => {
        const utilisation = r.utilisation || [];
        const coverage = r.coverage || [];
        const farmers = r.farmers || [];

        // Cards
        this.totalSubsidiesDisbursed.set(utilisation.reduce((s: number, x: any) => s + (x.totalDisbursed || 0), 0));
        this.schemeCount.set(utilisation.length);
        this.produceMarketSales.set(r.sales?.totalSalesValue || 0);
        this.salesCount.set(r.sales?.salesCount || 0);
        this.totalSownArea.set(coverage.reduce((s: number, x: any) => s + (x.area || 0), 0));
        this.seasonCount.set(coverage.length);
        this.activeFarmers.set(farmers.reduce((s: number, x: any) => s + (x.farmerCount || 0), 0));
        this.districtCount.set(farmers.length);

        // Charts
        this.buildTrendChart(r.trend || [], r.salesTrend || []);
        this.buildSeasonChart(coverage);
        this.analyticsLoading.set(false);
      },
      error: () => {
        this.analyticsError.set(true);
        this.analyticsLoading.set(false);
      }
    });
  }

  // Build the "Monthly Financial Progress" chart: two real series (subsidies
  // disbursed + produce sales) plotted over one merged, sorted month axis.
  private buildTrendChart(subsidyTrend: any[], salesTrend: any[]): void {
    const left = 60, right = 420, top = 30, base = 170;

    const subsidyByMonth = new Map<string, number>();
    subsidyTrend.forEach(t => subsidyByMonth.set(t.month, t.disbursedAmount || 0));
    const salesByMonth = new Map<string, number>();
    salesTrend.forEach(t => salesByMonth.set(t.month, t.salesAmount || 0));

    // Union of all months across both series, chronologically sorted.
    const months = Array.from(new Set([...subsidyByMonth.keys(), ...salesByMonth.keys()])).sort();
    if (!months.length) {
      this.trendMonths.set([]); this.trendYLabels.set([]);
      this.subsidyPts.set([]); this.subsidyPath.set(''); this.subsidyAreaPath.set('');
      this.salesPts.set([]); this.salesPath.set(''); this.salesAreaPath.set('');
      return;
    }

    const niceMax = this.niceCeil(Math.max(
      ...months.map(m => Math.max(subsidyByMonth.get(m) || 0, salesByMonth.get(m) || 0)), 1
    ));
    const n = months.length;
    const xAt = (i: number) => n === 1 ? (left + right) / 2 : left + i * ((right - left) / (n - 1));
    const yAt = (v: number) => +(base - (v / niceMax) * (base - top)).toFixed(1);

    this.trendMonths.set(months.map((m, i) => ({ x: +xAt(i).toFixed(1), label: this.shortMonth(m) })));

    const build = (byMonth: Map<string, number>) => {
      const pts = months.map((m, i) => ({ x: +xAt(i).toFixed(1), y: yAt(byMonth.get(m) || 0) }));
      const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const area = `M ${pts[0].x} ${base} ` + pts.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${pts[pts.length - 1].x} ${base} Z`;
      return { pts, line, area };
    };

    const subsidy = build(subsidyByMonth);
    this.subsidyPts.set(subsidy.pts); this.subsidyPath.set(subsidy.line); this.subsidyAreaPath.set(subsidy.area);
    const sales = build(salesByMonth);
    this.salesPts.set(sales.pts); this.salesPath.set(sales.line); this.salesAreaPath.set(sales.area);

    const labels: { y: number; label: string }[] = [];
    for (let k = 4; k >= 0; k--) {
      const val = niceMax * k / 4;
      labels.push({ y: yAt(val), label: this.kFmt(val) });
    }
    this.trendYLabels.set(labels);
  }

  // Build the sown-area-by-season bars from real data.
  private buildSeasonChart(coverage: any[]): void {
    const left = 60, right = 460, top = 30, base = 170;
    if (!coverage.length) {
      this.seasonBars.set([]); this.seasonYLabels.set([]);
      return;
    }
    const niceMax = this.niceCeil(Math.max(...coverage.map(c => c.area || 0), 1));
    const n = coverage.length;
    const slot = (right - left) / n;
    const barW = Math.min(40, slot * 0.5);
    const colors = ['#16a34a', '#f59e0b', '#3b82f6', '#a855f7', '#14b8a6', '#ef4444'];
    this.seasonBars.set(coverage.map((c, i) => {
      const cx = left + slot * i + slot / 2;
      const h = ((c.area || 0) / niceMax) * (base - top);
      return {
        x: +(cx - barW / 2).toFixed(1), y: +(base - h).toFixed(1), height: +h.toFixed(1), width: +barW.toFixed(1),
        label: c.season, value: c.area || 0, color: colors[i % colors.length]
      };
    }));
    const labels: { y: number; label: string }[] = [];
    for (let k = 4; k >= 0; k--) {
      const val = niceMax * k / 4;
      labels.push({ y: +(base - (val / niceMax) * (base - top)).toFixed(1), label: (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + ' Ac' });
    }
    this.seasonYLabels.set(labels);
  }

  // Round up to a "nice" axis maximum (1/2/5 × 10ⁿ) so gridlines read cleanly.
  private niceCeil(v: number): number {
    if (v <= 0) return 1;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / pow;
    const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return m * pow;
  }

  private shortMonth(ym: string): string {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const i = parseInt((ym || '').split('-')[1], 10) - 1;
    return i >= 0 && i < 12 ? names[i] : ym;
  }

  private kFmt(v: number): string {
    if (v >= 1000) return (v / 1000) % 1 === 0 ? `${v / 1000}k` : `${(v / 1000).toFixed(1)}k`;
    return String(Math.round(v));
  }

  initForm(): void {
    this.reportForm = this.fb.group({
      scope: ['', [Validators.required]]
    });
  }

  loadReports(): void {
    this.isLoading.set(true);
    this.reportService.getAllReports().subscribe({
      next: (data) => {
        this.reports.set(data.sort((a, b) => b.reportId - a.reportId));
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('Failed to retrieve generated reports.');
      }
    });
  }

  canGenerate(): boolean {
    return this.authService.hasRole(['SubsidyAdmin', 'ComplianceAnalyst', 'AgriLinkAdmin']);
  }

  private fmtDate(d: any): string {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  viewReportDetails(report: any) {
    this.detailTitle.set(`Report #${report.reportId}`);
    this.detailRows.set([
      { label: 'Report ID', value: report.reportId },
      { label: 'Scope', value: report.scope },
      { label: 'Metrics', value: report.metrics },
      { label: 'Generated By', value: 'User #' + report.generatedBy },
      { label: 'Generated Date', value: this.fmtDate(report.generatedDate) }
    ]);
    this.showDetailModal.set(true);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.reportForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  toggleMetric(metric: string): void {
    if (this.selectedMetrics.has(metric)) {
      this.selectedMetrics.delete(metric);
    } else {
      this.selectedMetrics.add(metric);
    }
    this.metricError.set(this.selectedMetrics.size === 0);
  }

  onGenerate(): void {
    if (this.reportForm.invalid || this.selectedMetrics.size === 0) {
      this.metricError.set(this.selectedMetrics.size === 0);
      return;
    }

    const val = this.reportForm.value;
    const today = new Date().toISOString().substring(0, 10);
    const dto = {
      scope: val.scope,
      metrics: Array.from(this.selectedMetrics).join(', '),
      generatedBy: this.authService.currentUserValue?.userId,
      generatedDate: today
    };

    this.reportService.generateReport(dto).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Report generated successfully.');
        this.loadReports();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to generate report.');
      }
    });
  }

  applyFilters(): void {
    let list = this.reports();
    if (this.scopeFilter) {
      list = list.filter(r => r.scope === this.scopeFilter);
    }
    this.filteredReports.set(list);
    this.currentPage = 0;
  }

  paginatedReports(): any[] {
    const sorted = applySort(this.filteredReports(), this.sortField(), this.sortAsc());
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return sorted.slice(start, end);
  }

  sortBy(field: string): void {
    toggleSort(this.sortField, this.sortAsc, field);
    this.currentPage = 0;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    localStorage.setItem('agrilink.tablePageSize', String(size));
  }

  confirmDelete(report: any): void {
    this.selectedReport.set(report);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
  }

  onDelete(): void {
    const id = this.selectedReport().reportId;
    this.reportService.deleteReport(id).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Report record deleted.');
        this.closeDeleteConfirm();
        this.loadReports();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to delete report.');
      }
    });
  }

  onExport(format: 'pdf' | 'excel'): void {
    this.isExporting.set(true);
    this.reportService.exportReports(format).subscribe({
      next: (blob) => {
        this.isExporting.set(false);
        const fileName = format === 'pdf' ? 'reports.pdf' : 'reports.xlsx';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toastService.success(`Exported report file successfully as ${format.toUpperCase()}.`);
      },
      error: () => {
        this.isExporting.set(false);
        this.toastService.error('Failed to export reports file.');
      }
    });
  }
}
