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
  templateUrl: './report-dashboard.component.html',
  styleUrls: ['./report-dashboard.component.css']
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
