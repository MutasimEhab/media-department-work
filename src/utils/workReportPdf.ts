import organizationLogo from '../assets/brand/organization-logo.png';

export type WorkReportRow = {
  id: string;
  userId: string;
  userNameAr: string;
  date: string;
  time?: string;
  activityAr: string;
  location: 'OFFICE' | 'FIELD';
  area?: string;
};

export type ReportEmployee = { id: string; arabicName: string; employeeNumber?: string; jobTitleAr?: string };

async function dataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('تعذر تحميل شعار المؤسسة للتقرير.');
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الترويسة.'));
    reader.readAsDataURL(blob);
  });
}

async function fontBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('تعذر تحميل الخط العربي للتقرير.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function footerWave(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="250" viewBox="0 0 1800 250"><path fill="#8d8d8d" d="M0 0 C430 20 650 82 1040 250 L1120 250 C720 83 515 22 0 0Z"/><path fill="#c80893" d="M0 18 C420 35 590 110 910 250 L1010 250 C680 100 510 36 0 18Z"/></svg>`;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('تعذر تجهيز تذييل الكشف.')); });
  const canvas = document.createElement('canvas');
  canvas.width = 1800; canvas.height = 250;
  canvas.getContext('2d')!.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
}

function formatArabicDate(value: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('ar-PS', {
    ...options, timeZone: 'UTC', calendar: 'gregory', numberingSystem: 'latn',
  }).format(new Date(`${value}T12:00:00Z`));
}

function numericDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}

export async function downloadWorkReportPdf(
  rows: WorkReportRow[],
  employees: ReportEmployee[],
  from: string,
  to: string,
  selectedEmployeeId = '',
) {
  const [{ jsPDF }, { default: autoTable }, logo, font, wave] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    dataUrl(organizationLogo),
    fontBase64((await import('../assets/brand/fonts/Janna-LT-Regular.ttf?url')).default),
    footerWave(),
  ]);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.addFileToVFS('Janna-Regular.ttf', font);
  doc.addFont('Janna-Regular.ttf', 'Janna', 'normal');
  doc.setFont('Janna');
  doc.setR2L(true);

  const employeeById = new Map(employees.map(employee => [employee.id, employee]));
  const groups = new Map<string, WorkReportRow[]>();
  for (const row of rows) groups.set(row.userId, [...(groups.get(row.userId) || []), row]);
  const ids = selectedEmployeeId ? [selectedEmployeeId] : [...groups.keys()];
  if (!ids.length) throw new Error('لا توجد سجلات مطابقة لتصديرها.');
  const reportDates = rows.map(row => row.date).sort();
  const reportFrom = from || reportDates[0] || '';
  const reportTo = to || reportDates[reportDates.length - 1] || '';
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let isFirstPage = true;

  const drawHeader = (employee: ReportEmployee, pageIndex: number) => {
    const width = doc.internal.pageSize.getWidth();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, width, 74, 'F');
    doc.addImage(logo, 'PNG', margin + 1, 9, 27, 27);
    doc.setTextColor(68, 68, 68);
    doc.setFontSize(12);
    doc.text('مؤسسة السمع والبصر', margin + 32, 14);
    doc.setFontSize(10);
    doc.text('للتنمية والتأهيل المجتمعي', margin + 32, 20);
    doc.setTextColor(135, 18, 129);
    doc.setFontSize(8);
    doc.text('The Hearing and Sight Foundation', margin + 32, 26);
    doc.setTextColor(90, 90, 90);
    doc.setFontSize(7);
    doc.text('For Development and Community Rehabilitation', margin + 32, 31);
    doc.setDrawColor(200, 8, 147);
    doc.setLineWidth(.8);
    doc.line(margin + 32, 35, margin + 76, 35);
    doc.setTextColor(135, 18, 129);
    doc.setFontSize(17);
    doc.text(`كشف الموظف: ${employee.arabicName}`, width / 2, 47, { align: 'center' });
    doc.setDrawColor(200, 8, 147);
    doc.setLineWidth(1.1);
    doc.line(margin, 50, width - margin, 50);
    doc.setLineWidth(.25);
    doc.setDrawColor(213, 215, 220);
    doc.roundedRect(margin, 53, width - margin * 2, 8, 1.5, 1.5, 'S');
    doc.roundedRect(margin, 63, width - margin * 2, 8, 1.5, 1.5, 'S');
    doc.setTextColor(68, 68, 68);
    doc.setFontSize(9);
    doc.text(`الرقم الوظيفي: ${employee.employeeNumber || '—'}`, width - margin - 4, 58.5, { align: 'right' });
    doc.text(`اسم الموظف: ${employee.arabicName}`, margin + 4, 58.5);
    doc.text(`من تاريخ: ${reportFrom ? numericDate(reportFrom) : '—'}`, width - margin - 4, 68.5, { align: 'right' });
    doc.text(`إلى تاريخ: ${reportTo ? numericDate(reportTo) : '—'}`, margin + 4, 68.5);
    if (pageIndex > 1) {
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8);
      doc.text(`تابع كشف ${employee.arabicName}`, width / 2, 68, { align: 'center' });
    }
  };

  ids.forEach(id => {
    const employee = employeeById.get(id) || {
      id, arabicName: groups.get(id)?.[0]?.userNameAr || 'موظف',
    };
    const employeeRows = [...(groups.get(id) || [])].sort((a, b) => b.date.localeCompare(a.date));
    if (!isFirstPage) doc.addPage();
    isFirstPage = false;
    let tablePageIndex = 0;
    drawHeader(employee, 1);
    autoTable(doc, {
      startY: 74,
      margin: { top: 74, right: margin, bottom: 43, left: margin },
      head: [['تفاصيل العمل', 'طبيعة العمل', 'التاريخ', 'اليوم', 'اسم الموظف', '#']],
      body: employeeRows.map((row, index) => [
        row.area ? `${row.activityAr}\nالمنطقة: ${row.area}` : row.activityAr,
        row.location === 'FIELD' ? 'ميداني' : 'مكتبي',
        numericDate(row.date),
        formatArabicDate(row.date, { weekday: 'long' }), employee.arabicName, String(index + 1),
      ]),
      theme: 'grid',
      styles: { font: 'Janna', fontSize: 9, cellPadding: 2.8, overflow: 'linebreak', halign: 'right', valign: 'middle', textColor: [38, 38, 38], lineColor: [213, 215, 220], lineWidth: .2 },
      headStyles: { fillColor: [135, 18, 129], textColor: [255, 255, 255], fontStyle: 'normal', halign: 'center' },
      alternateRowStyles: { fillColor: [250, 246, 250] },
      columnStyles: { 0: { cellWidth: 84 }, 1: { cellWidth: 21, halign: 'center' }, 2: { cellWidth: 25, halign: 'center' }, 3: { cellWidth: 18, halign: 'center' }, 4: { cellWidth: 32 }, 5: { cellWidth: 8, halign: 'center' } },
      didDrawPage: () => {
        tablePageIndex += 1;
        if (tablePageIndex > 1) drawHeader(employee, tablePageIndex);
        doc.setDrawColor(200, 8, 147);
        doc.setLineWidth(.2);
        doc.line(margin, pageHeight - 42, pageWidth - margin, pageHeight - 42);
        doc.setTextColor(68, 68, 68);
        doc.setFontSize(8);
        doc.addImage(wave, 'PNG', 0, pageHeight - 20, pageWidth, 20);
        doc.text('+970 59 5839739  ·  +970 59 2728006', pageWidth - margin, pageHeight - 33, { align: 'right' });
        doc.text('info@alsam3.net', pageWidth - margin, pageHeight - 27, { align: 'right' });
        doc.text('فلسطين - غزة - شارع الوحدة - بجوار مكتبة بلدية غزة', pageWidth - margin, pageHeight - 21, { align: 'right' });
        doc.setTextColor(135, 18, 129);
        doc.setFontSize(7);
        doc.text(`صفحة ${doc.getCurrentPageInfo().pageNumber}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
      },
    });
  });

  const range = `${reportFrom || 'كل-الفترة'}-${reportTo || 'حتى-اليوم'}`;
  const blob = doc.output('blob');
  if (!(blob instanceof Blob) || blob.size === 0) throw new Error('تعذر تجهيز ملف PDF؛ حاول تنزيل الكشف مرة أخرى.');
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `كشف-الأعمال-${range}.pdf`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
