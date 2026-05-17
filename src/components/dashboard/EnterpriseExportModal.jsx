import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileSpreadsheet, FileText, Check, Loader2, Sparkles, Settings } from 'lucide-react';
import { goalsService, usersService } from '../../lib/services';
import { GOAL_STATUS, computeProgressScore } from '../../lib/constants';
import { cn } from '../../lib/utils';

export default function EnterpriseExportModal({ isOpen, onClose }) {
  const [data, setData] = useState({ goals: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel'); // 'excel' | 'csv'
  const [exportType, setExportType] = useState('all_performance'); // 'all_performance' | 'goals_only' | 'dept_summary'
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const [selectedFields, setSelectedFields] = useState({
    employeeName: true,
    department: true,
    goalTitle: true,
    target: true,
    achievement: true,
    status: true,
    quarterlyProgress: true,
  });

  useEffect(() => {
    if (isOpen) {
      // Prefetch data
      async function prefetch() {
        try {
          const [allGoals, allUsers] = await Promise.all([
            goalsService.getAllGoals(),
            usersService.getAllUsers()
          ]);
          setData({ goals: allGoals, users: allUsers });
        } catch (err) {
          console.error('Failed to prefetch export data:', err);
        }
      }
      prefetch();
    }
  }, [isOpen]);

  const toggleField = (field) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleExport = async () => {
    setExporting(true);
    setProgress(10);
    setStatusText('Initiating database extraction...');
    
    // Step-by-step simulated progress for elite UI experience
    const steps = [
      { p: 30, text: 'Extracting records from Supabase tables...' },
      { p: 55, text: 'Compiling employee performance statistics...' },
      { p: 80, text: 'Assembling document styles and schemas...' },
      { p: 100, text: 'Export complete! Dispatching download...' }
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 350));
      setProgress(steps[i].p);
      setStatusText(steps[i].text);
    }

    // Process export
    const exportData = [];
    const { goals, users } = data;

    if (exportType === 'all_performance') {
      users.forEach(user => {
        const userGoals = goals.filter(g => g.employee_id === user.id);
        if (userGoals.length === 0) {
          exportData.push({
            employeeName: user.name,
            department: user.department,
            goalTitle: 'No active goals assigned',
            target: 'N/A',
            achievement: '0%',
            status: 'N/A',
            quarterlyProgress: 'No check-ins recorded'
          });
        } else {
          userGoals.forEach(goal => {
            const cis = goal.check_ins || {};
            // Calculate completed checkpoints count
            let completedCount = 0;
            if (cis) {
              if (Array.isArray(cis)) {
                completedCount = cis.filter(ci => ci?.status === 'completed').length;
              } else if (typeof cis === 'object') {
                completedCount = Object.values(cis).filter(ci => ci?.status === 'completed').length;
              }
            }
            
            // Achievement calculated by computing last completed check-in or simple avg
            let avgScore = 0;
            if (cis) {
              if (Array.isArray(cis) && cis.length > 0) {
                const scores = cis.map(ci => computeProgressScore(goal, ci)).filter(s => s !== null);
                if (scores.length > 0) avgScore = Math.round(scores.reduce((s, a) => s + a, 0) / scores.length);
              } else if (typeof cis === 'object') {
                const scores = Object.values(cis).map(ci => computeProgressScore(goal, ci)).filter(s => s !== null);
                if (scores.length > 0) avgScore = Math.round(scores.reduce((s, a) => s + a, 0) / scores.length);
              }
            }

            exportData.push({
              employeeName: user.name,
              department: user.department,
              goalTitle: goal.title,
              target: goal.target || '—',
              achievement: `${avgScore}%`,
              status: goal.status.toUpperCase(),
              quarterlyProgress: `${completedCount}/4 Completed check-ins`
            });
          });
        }
      });
    } else if (exportType === 'goals_only') {
      goals.forEach(goal => {
        const user = users.find(u => u.id === goal.employee_id);
        exportData.push({
          employeeName: user?.name || 'Unassigned',
          department: user?.department || 'Operations',
          goalTitle: goal.title,
          target: goal.target || '—',
          achievement: goal.status === 'approved' ? 'Approved' : 'Pending Review',
          status: goal.status.toUpperCase(),
          quarterlyProgress: goal.thrust_area || 'KPI'
        });
      });
    } else if (exportType === 'dept_summary') {
      const depts = [...new Set(users.map(u => u.department))];
      depts.forEach(dept => {
        const deptUsers = users.filter(u => u.department === dept);
        const deptGoals = goals.filter(g => deptUsers.some(u => u.id === g.employee_id));
        const approved = deptGoals.filter(g => g.status === GOAL_STATUS.APPROVED).length;
        
        exportData.push({
          employeeName: `Department: ${dept}`,
          department: dept,
          goalTitle: `Total headcount: ${deptUsers.length}`,
          target: `${deptGoals.length} total goals`,
          achievement: `${approved} approved`,
          status: 'ACTIVE',
          quarterlyProgress: `Compliance: ${deptGoals.length > 0 ? Math.round((approved/deptGoals.length)*100) : 0}%`
        });
      });
    }

    const filename = `performx_export_${exportType}_${new Date().toISOString().split('T')[0]}`;

    if (exportFormat === 'excel') {
      triggerExcelDownload(exportData, `${filename}.xls`);
    } else {
      triggerCSVDownload(exportData, `${filename}.csv`);
    }

    // Success Toast
    setToast({
      title: 'Report exported successfully',
      desc: `${filename}.${exportFormat === 'excel' ? 'xls' : 'csv'} has been saved to your downloads.`
    });

    // Reset status after short delay
    setTimeout(() => {
      setExporting(false);
      setProgress(0);
      setStatusText('');
    }, 500);
  };

  const triggerCSVDownload = (flatData, filename) => {
    const headers = [];
    if (selectedFields.employeeName) headers.push('Employee Name');
    if (selectedFields.department) headers.push('Department');
    if (selectedFields.goalTitle) headers.push('Goal Title');
    if (selectedFields.target) headers.push('Target');
    if (selectedFields.achievement) headers.push('Achievement / Score');
    if (selectedFields.status) headers.push('Status');
    if (selectedFields.quarterlyProgress) headers.push('Quarterly Progress');

    const csvRows = [headers.join(',')];

    flatData.forEach(row => {
      const cols = [];
      if (selectedFields.employeeName) cols.push(`"${row.employeeName.replace(/"/g, '""')}"`);
      if (selectedFields.department) cols.push(`"${row.department.replace(/"/g, '""')}"`);
      if (selectedFields.goalTitle) cols.push(`"${row.goalTitle.replace(/"/g, '""')}"`);
      if (selectedFields.target) cols.push(`"${row.target.replace(/"/g, '""')}"`);
      if (selectedFields.achievement) cols.push(`"${row.achievement.replace(/"/g, '""')}"`);
      if (selectedFields.status) cols.push(`"${row.status.replace(/"/g, '""')}"`);
      if (selectedFields.quarterlyProgress) cols.push(`"${row.quarterlyProgress.replace(/"/g, '""')}"`);
      csvRows.push(cols.join(','));
    });

    const content = csvRows.join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerExcelDownload = (flatData, filename) => {
    let excelXml = `
      <xml xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>PerformX Report</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            table { border-collapse: collapse; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
            th { background-color: #f97316; color: #ffffff; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; }
            td { padding: 9px 10px; border: 1px solid #e2e8f0; font-size: 12px; color: #334155; }
            tr:nth-child(even) { background-color: #fffaf8; }
            .title-cell { font-size: 18px; font-weight: bold; color: #ea580c; padding: 15px 10px; }
            .meta-cell { font-size: 11px; color: #64748b; padding: 0 10px 15px 10px; }
            .status-badge { font-weight: bold; color: #ea580c; }
          </style>
        </head>
        <body>
          <table>
            <tr>
              <td colspan="7" class="title-cell">PerformX Corporate Intelligence Report</td>
            </tr>
            <tr>
              <td colspan="7" class="meta-cell">Generated: ${new Date().toLocaleString()} | Source: Supabase Realtime Portal Database</td>
            </tr>
            <tr style="height: 35px;">
    `;

    // Headers
    if (selectedFields.employeeName) excelXml += `<th>Employee Name</th>`;
    if (selectedFields.department) excelXml += `<th>Department</th>`;
    if (selectedFields.goalTitle) excelXml += `<th>Goal Title</th>`;
    if (selectedFields.target) excelXml += `<th>Target</th>`;
    if (selectedFields.achievement) excelXml += `<th>Achievement / Score</th>`;
    if (selectedFields.status) excelXml += `<th>Status</th>`;
    if (selectedFields.quarterlyProgress) excelXml += `<th>Quarterly Progress</th>`;

    excelXml += `</tr>`;

    // Data rows
    flatData.forEach(row => {
      excelXml += `<tr>`;
      if (selectedFields.employeeName) excelXml += `<td>${row.employeeName}</td>`;
      if (selectedFields.department) excelXml += `<td>${row.department}</td>`;
      if (selectedFields.goalTitle) excelXml += `<td>${row.goalTitle}</td>`;
      if (selectedFields.target) excelXml += `<td>${row.target}</td>`;
      if (selectedFields.achievement) excelXml += `<td>${row.achievement}</td>`;
      if (selectedFields.status) excelXml += `<td class="status-badge">${row.status}</td>`;
      if (selectedFields.quarterlyProgress) excelXml += `<td>${row.quarterlyProgress}</td>`;
      excelXml += `</tr>`;
    });

    excelXml += `
          </table>
        </body>
      </xml>
    `;

    const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="fixed top-6 right-6 z-[100] w-96 bg-white border-l-4 border-orange-500 rounded-2xl shadow-2xl p-4 flex gap-3.5 backdrop-blur-md"
          >
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 self-start">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">{toast.title}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{toast.desc}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 transition-colors self-start">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Modal Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark glassmorphic backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', damping: 26, stiffness: 290 }}
              className="relative w-full max-w-xl bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Top Orange Gradient Ribbon */}
              <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 w-full" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all z-20"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-3">
                    <Sparkles className="h-3 w-3" /> Intelligence Engine
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900">Enterprise Report Exporter</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Configure and export corporate performance data compiled from the Supabase core.</p>
                </div>

                {/* Scope selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Select Report Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'all_performance', label: 'All Performance', desc: 'Goals + Check-ins' },
                      { id: 'goals_only', label: 'Goals Listing', desc: 'KPI Status & Target' },
                      { id: 'dept_summary', label: 'Dept Summary', desc: 'Department statistics' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setExportType(type.id)}
                        className={cn(
                          "flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-200",
                          exportType === type.id 
                            ? "bg-orange-50/50 border-orange-500 shadow-sm" 
                            : "bg-white border-slate-200 hover:bg-slate-50/50"
                        )}
                      >
                        <span className={cn("text-xs font-bold", exportType === type.id ? "text-orange-700" : "text-slate-800")}>{type.label}</span>
                        <span className="text-[10px] text-slate-500 font-medium mt-1 leading-snug">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Columns Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Settings className="h-3.5 w-3.5" /> 2. Customize Columns
                    </label>
                    <button 
                      onClick={() => setSelectedFields({ employeeName: true, department: true, goalTitle: true, target: true, achievement: true, status: true, quarterlyProgress: true })} 
                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 transition-all uppercase tracking-wider"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 grid grid-cols-2 gap-3">
                    {[
                      { id: 'employeeName', label: 'Employee Name' },
                      { id: 'department', label: 'Department' },
                      { id: 'goalTitle', label: 'Goal Title' },
                      { id: 'target', label: 'Planned Target' },
                      { id: 'achievement', label: 'Achievement Score' },
                      { id: 'status', label: 'Approved Status' },
                      { id: 'quarterlyProgress', label: 'Quarterly Check-ins' }
                    ].map(field => (
                      <button
                        key={field.id}
                        onClick={() => toggleField(field.id)}
                        className="flex items-center gap-2.5 text-left group"
                      >
                        <div className={cn(
                          "h-4 w-4 rounded-md border flex items-center justify-center transition-all duration-150 flex-shrink-0",
                          selectedFields[field.id] 
                            ? "bg-orange-500 border-orange-500 text-white shadow-sm" 
                            : "border-slate-300 group-hover:border-slate-400 bg-white"
                        )}>
                          {selectedFields[field.id] && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className={cn("text-xs font-semibold", selectedFields[field.id] ? "text-slate-800" : "text-slate-500 group-hover:text-slate-700")}>{field.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formats Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Format Choice</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setExportFormat('excel')}
                      className={cn(
                        "flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-200",
                        exportFormat === 'excel' 
                          ? "bg-orange-50/50 border-orange-500 shadow-sm" 
                          : "bg-white border-slate-200 hover:bg-slate-50/50"
                      )}
                    >
                      <div className={cn("p-2 rounded-xl", exportFormat === 'excel' ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500")}>
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className={cn("text-xs font-bold", exportFormat === 'excel' ? "text-orange-700" : "text-slate-800")}>Excel Spreadsheet</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Rich formatted report (.xls)</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setExportFormat('csv')}
                      className={cn(
                        "flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-200",
                        exportFormat === 'csv' 
                          ? "bg-orange-50/50 border-orange-500 shadow-sm" 
                          : "bg-white border-slate-200 hover:bg-slate-50/50"
                      )}
                    >
                      <div className={cn("p-2 rounded-xl", exportFormat === 'csv' ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500")}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className={cn("text-xs font-bold", exportFormat === 'csv' ? "text-orange-700" : "text-slate-800")}>Raw CSV Format</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Perfect for third-party tools</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Progress bar overlay when exporting */}
                {exporting && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-orange-50/40 border border-orange-100 rounded-2xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-orange-800 flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin text-orange-600" />
                        {statusText}
                      </span>
                      <span className="font-extrabold text-orange-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" 
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-3.5 px-4 rounded-2xl text-xs transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    id="trigger-export-confirm"
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs transition-all duration-200 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? 'Generating Report...' : `Export Report`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
