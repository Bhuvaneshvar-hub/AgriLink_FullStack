import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReportService } from '../../../services/report.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../../components/detail-modal/detail-modal.component';

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
            <button class="btn btn-secondary" (click)="onExport('excel')" [disabled]="isExporting()">
              <i class="material-icons-round text-success">table_view</i>
              <span>Export XLS</span>
            </button>
            <button class="btn btn-secondary" (click)="onExport('pdf')" [disabled]="isExporting()" style="margin-left: 0.5rem;">
              <i class="material-icons-round text-danger">picture_as_pdf</i>
              <span>Export PDF</span>
            </button>
          </div>
        }
      </div>

      <!-- Visual Analytics Section -->
      <div class="analytics-visuals mb-4">
        <!-- VCards Metrics Row -->
        <div class="metrics-row mb-4">
          <div class="metric-card">
            <div class="metric-icon subsidy">
              <i class="material-icons-round">payments</i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Total Subsidies Disbursed</span>
              <h2 class="metric-value">₹96,750</h2>
              <span class="metric-sub text-success"><i class="material-icons-round text-success">trending_up</i> +15% from last month</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon sales">
              <i class="material-icons-round">shopping_bag</i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Produce Market Sales</span>
              <h2 class="metric-value">₹1,27,230</h2>
              <span class="metric-sub text-success"><i class="material-icons-round text-success">trending_up</i> +28% from last month</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon crops">
              <i class="material-icons-round">eco</i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Total Sown Crops</span>
              <h2 class="metric-value">18 Plans</h2>
              <span class="metric-sub text-secondary"><i class="material-icons-round">update</i> Active plans in current season</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon farmers">
              <i class="material-icons-round">people</i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Active Farmers Registered</span>
              <h2 class="metric-value">25 Farmers</h2>
              <span class="metric-sub text-success"><i class="material-icons-round text-success">trending_up</i> +8 new profiles</span>
            </div>
          </div>
        </div>

        <div class="charts-row">
          <!-- Monthly Transactions Line Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Monthly Financial Progress (2026)</h3>
              <div class="chart-legend">
                <span class="legend-item"><span class="color-dot sales"></span>Sales</span>
                <span class="legend-item"><span class="color-dot subsidies"></span>Subsidies</span>
              </div>
            </div>
            <div class="chart-container">
              <!-- Inline SVG Line Chart -->
              <svg viewBox="-20 0 520 220" class="svg-chart">
                <!-- Gradients -->
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
                
                <!-- Grid Lines -->
                <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="60" x2="480" y2="60" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" stroke-width="1.5"/>

                <!-- Y Axis Labels -->
                <text x="35" y="25" text-anchor="end" class="chart-text">50k</text>
                <text x="35" y="65" text-anchor="end" class="chart-text">30k</text>
                <text x="35" y="105" text-anchor="end" class="chart-text">15k</text>
                <text x="35" y="145" text-anchor="end" class="chart-text">5k</text>
                <text x="35" y="174" text-anchor="end" class="chart-text">0</text>

                <!-- X Axis Labels (Jan - Jul) -->
                <text x="60" y="190" text-anchor="middle" class="chart-text">Jan</text>
                <text x="120" y="190" text-anchor="middle" class="chart-text">Feb</text>
                <text x="180" y="190" text-anchor="middle" class="chart-text">Mar</text>
                <text x="240" y="190" text-anchor="middle" class="chart-text">Apr</text>
                <text x="300" y="190" text-anchor="middle" class="chart-text">May</text>
                <text x="360" y="190" text-anchor="middle" class="chart-text">Jun</text>
                <text x="420" y="190" text-anchor="middle" class="chart-text">Jul</text>

                <!-- Area Paths -->
                <!-- Sales Area -->
                <path d="M 60 170 L 60 78 L 120 170 L 180 73 L 240 170 L 300 170 L 360 100 L 420 170 Z" fill="url(#salesGrad)"/>
                <!-- Subsidies Area -->
                <path d="M 60 170 L 60 134 L 120 134 L 180 170 L 240 144 L 300 170 L 360 170 L 420 170 Z" fill="url(#subsidiesGrad)"/>

                <!-- Lines -->
                <!-- Sales Line -->
                <path d="M 60 78 L 120 170 L 180 73 L 240 170 L 300 170 L 360 100 L 420 170" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- Subsidies Line -->
                <path d="M 60 134 L 120 134 L 180 170 L 240 144 L 300 170 L 360 170 L 420 170" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

                <!-- Data Dots -->
                <!-- Sales Dots -->
                <circle cx="60" cy="78" r="4" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>
                <circle cx="120" cy="170" r="4" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>
                <circle cx="180" cy="73" r="4" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>
                <circle cx="240" cy="170" r="4" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>
                <circle cx="360" cy="100" r="4" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>
                
                <!-- Subsidies Dots -->
                <circle cx="60" cy="134" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
                <circle cx="120" cy="134" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
                <circle cx="240" cy="144" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>

                <!-- Axis Titles -->
                <text x="260" y="215" text-anchor="middle" class="chart-axis-title">Month (2026)</text>
                <text x="-8" y="95" text-anchor="middle" transform="rotate(-90 -8 95)" class="chart-axis-title">Amount (₹)</text>
              </svg>
            </div>
          </div>

          <!-- Crop Yield Area distribution Bar Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Expected Crop Yield Distribution (Acre Area)</h3>
              <div class="chart-legend">
                <span class="legend-item"><span class="color-dot paddy"></span>Paddy</span>
                <span class="legend-item"><span class="color-dot wheat"></span>Wheat</span>
                <span class="legend-item"><span class="color-dot cotton"></span>Cotton</span>
                <span class="legend-item"><span class="color-dot groundnut"></span>Groundnut</span>
              </div>
            </div>
            <div class="chart-container">
              <svg viewBox="-20 0 520 220" class="svg-chart">
                <!-- Grid Lines -->
                <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="60" x2="480" y2="60" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" stroke-width="1.5"/>

                <!-- Y Axis Labels -->
                <text x="35" y="25" text-anchor="end" class="chart-text">30 Ac</text>
                <text x="35" y="65" text-anchor="end" class="chart-text">20 Ac</text>
                <text x="35" y="105" text-anchor="end" class="chart-text">10 Ac</text>
                <text x="35" y="145" text-anchor="end" class="chart-text">5 Ac</text>
                <text x="35" y="174" text-anchor="end" class="chart-text">0</text>

                <!-- X Axis Labels (Crops) -->
                <text x="100" y="190" text-anchor="middle" class="chart-text">Paddy</text>
                <text x="200" y="190" text-anchor="middle" class="chart-text">Wheat</text>
                <text x="300" y="190" text-anchor="middle" class="chart-text">Cotton</text>
                <text x="400" y="190" text-anchor="middle" class="chart-text">Groundnut</text>

                <!-- Bars (Paddy expected: 24, Wheat: 18.5, Cotton: 12, Groundnut: 15) -->
                <!-- Paddy -->
                <rect x="80" y="44" width="40" height="126" rx="4" fill="#16a34a" class="svg-bar"/>
                <text x="100" y="36" text-anchor="middle" font-weight="600" font-size="11" fill="#0f766e">24 Ac</text>

                <!-- Wheat -->
                <rect x="180" y="66" width="40" height="104" rx="4" fill="#f59e0b" class="svg-bar"/>
                <text x="200" y="58" text-anchor="middle" font-weight="600" font-size="11" fill="#b45309">18.5 Ac</text>

                <!-- Cotton -->
                <rect x="280" y="92" width="40" height="78" rx="4" fill="#3b82f6" class="svg-bar"/>
                <text x="300" y="84" text-anchor="middle" font-weight="600" font-size="11" fill="#1d4ed8">12 Ac</text>

                <!-- Groundnut -->
                <rect x="380" y="80" width="40" height="90" rx="4" fill="#a855f7" class="svg-bar"/>
                <text x="400" y="72" text-anchor="middle" font-weight="600" font-size="11" fill="#6b21a8">15 Ac</text>

                <!-- Axis Titles -->
                <text x="260" y="215" text-anchor="middle" class="chart-axis-title">Crop</text>
                <text x="-8" y="95" text-anchor="middle" transform="rotate(-90 -8 95)" class="chart-axis-title">Area (Acres)</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-layout">
        <!-- Generate Report Form -->
        @if (canGenerate()) {
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

              <button type="submit" class="btn btn-primary w-100 mt-3" [disabled]="reportForm.invalid || selectedMetrics.size === 0">
                <i class="material-icons-round">analytics</i>
                <span>Generate Report Metadata</span>
              </button>
            </form>
          </div>
        }

        <!-- Reports List -->
        <div class="card list-card" [class.full-width]="!canGenerate()">
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
                      <th>Date</th>
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
                            <button class="menu-item" (click)="viewReportDetails(report)">
                              <i class="material-icons-round">visibility</i> View
                            </button>
                            @if (canGenerate()) {
                              <button class="menu-item danger" (click)="confirmDelete(report)">
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
      </div>

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

  // Pagination
  currentPage = 0;
  pageSize = 10;

  // Form
  reportForm!: FormGroup;

  ngOnInit(): void {
    this.loadReports();
    this.initForm();
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
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredReports().slice(start, end);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
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
