import { jsPDF } from 'jspdf'
// html2canvas-pro, not html2canvas: only the -pro fork understands the
// oklch()/lab() colors Tailwind v4 emits; the original throws at capture time.
import html2canvas from 'html2canvas-pro'
import { Invoice, InvoiceItem } from '../types/invoice'

// Pure helpers shared by the /invoices pages. Ported from the legacy
// InvoiceList component, which keeps its own private copies — behavior
// (and the captured PDF/PNG output) must stay identical to it.

// INR amount → English words with Indian grouping (Crore/Lakh/Thousand).
export const toWords = (num: number): string => {
  const a: string[] = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b: string[] = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const seg = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n%10 ? '-' + a[n%10] : '');
    return a[Math.floor(n/100)] + ' Hundred' + (n % 100 ? ' ' + seg(n % 100) : '');
  };
  const rounded: number = Math.round((num + Number.EPSILON) * 100) / 100;
  const rupees: number = Math.floor(rounded);
  const paise: number = Math.round((rounded - rupees) * 100);

  const rupeesToWords = (value: number): string => {
    if (value === 0) return 'Zero';
    let str: string = '';
    const crore: number = Math.floor(value / 10000000);
    const lakh: number = Math.floor((value / 100000) % 100);
    const thousand: number = Math.floor((value / 1000) % 100);
    const hundred: number = Math.floor((value / 100) % 10);
    const rest: number = value % 100;
    if (crore) str += seg(crore) + ' Crore ';
    if (lakh) str += seg(lakh) + ' Lakh ';
    if (thousand) str += seg(thousand) + ' Thousand ';
    if (hundred) str += a[hundred] + ' Hundred ';
    if (rest) str += seg(rest);
    return str.trim();
  };

  const words = rupeesToWords(rupees);
  if (paise > 0) {
    return `${words} Rupees and ${seg(paise)} Paise`;
  }
  return `${words} Rupees`;
};

// Invoice total in INR (item amounts are in the foreign currency).
export const invoiceTotalINR = (invoice: Pick<Invoice, 'items' | 'fxRate'>): number =>
  invoice.items.reduce((acc, item) => acc + item.amount * invoice.fxRate, 0)

// Invoice dates may arrive as Date objects or as strings (already formatted).
export const formatInvoiceDate = (date: Date | string): string =>
  typeof date === 'string' ? date : new Date(date).toLocaleDateString('en-GB')

// Filesystem-safe timestamp used in download filenames.
export const timestampSlug = (): string =>
  new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)

// Capture `element` as rendered on screen and save it as an A4 PDF, scaled to
// fit within a 20pt margin and horizontally centered.
export const downloadElementAsPdf = async (element: HTMLElement): Promise<void> => {
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 20; // margin in points
  // Adjust image dimensions to fit within A4 size while preserving aspect ratio
  const imgProps = pdf.getImageProperties(imgData);
  const availableWidth = pdfWidth - 2 * margin;
  const availableHeight = pdfHeight - 2 * margin;
  const ratio = Math.min(availableWidth / imgProps.width, availableHeight / imgProps.height);
  const imgWidth = imgProps.width * ratio;
  const imgHeight = imgProps.height * ratio;
  const x = (pdfWidth - imgWidth) / 2;
  const y = margin;
  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
  pdf.save(`invoice_${timestampSlug()}.pdf`);
};

// Capture `element` as rendered on screen and save it as a PNG.
export const downloadElementAsPng = async (element: HTMLElement): Promise<void> => {
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imgData;
  link.download = `invoice_${timestampSlug()}.png`;
  link.click();
};

// The create-invoice form state. Mirrors the invoice's denormalized fields
// (invoiceDate as a yyyy-mm-dd string for the date input) plus the ids of the
// saved supplier/client entries the user picked ('' = entering a new one).
export interface InvoiceFormValues {
  invoiceNumber: string
  invoiceDate: string
  supplierName: string
  supplierGSTIN: string
  supplierAddress: string
  recipientName: string
  recipientEmail: string
  recipientAddress: string
  recipientCountry: string
  recipientCurrency: string
  fxRate: number
  lutId: string
  items: InvoiceItem[]
  notes: string
  supplierId: string
  clientId: string
}

export const emptyInvoiceFormValues = (): InvoiceFormValues => ({
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  supplierName: '',
  supplierGSTIN: '',
  supplierAddress: '',
  recipientName: '',
  recipientEmail: '',
  recipientAddress: '',
  recipientCountry: '',
  recipientCurrency: 'USD',
  fxRate: 86.50,
  lutId: '',
  items: [{ hsn: '', description: '', quantity: 1, rate: 0, amount: 0 }],
  notes: '',
  supplierId: '',
  clientId: '',
})
