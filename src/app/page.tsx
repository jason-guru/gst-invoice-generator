'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

// Utility to convert rupees to words
const toWords = (num: number): string => {
  const a: string[] = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b: string[] = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const seg = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n%10 ? ' ' + a[n%10] : '');
    return a[Math.floor(n/100)] + ' Hundred' + (n % 100 ? ' ' + seg(n % 100) : '');
  };
  if (num === 0) return 'Zero';
  let str: string = '';
  const crore: number = Math.floor(num / 10000000);
  const lakh: number = Math.floor((num / 100000) % 100);
  const thousand: number = Math.floor((num / 1000) % 100);
  const hundred: number = Math.floor((num / 100) % 10);
  const rest: number = num % 100;
  if (crore) str += seg(crore) + ' Crore ';
  if (lakh) str += seg(lakh) + ' Lakh ';
  if (thousand) str += seg(thousand) + ' Thousand ';
  if (hundred) str += a[hundred] + ' Hundred ';
  if (rest) str += (str ? 'and ' : '') + seg(rest);
  return str.trim();
};

export default function Home() {
  // Prefilled sample data
  const defaultInv = { number: 'INV-2025-001', date: new Date().toISOString().slice(0,10) };
  const defaultSupplier = {
    name: 'XYZ Technologies Pvt Ltd',
    gstin: '07AAACX1234F1Z5',
    addr: '123 Tech Park, Sector 18\nGurgaon, Haryana 122018\nIndia'
  };
  const defaultBuyer = {
    name: 'ABC Solutions Ltd',
    addr: '456 Business Center\nRua das Flores, 789\nSão Paulo, SP 01234-567\nBrazil',
    country: 'Brazil',
    currency: 'USD',
    gstin: 'URP',
    pos: '96 – Foreign Country',
    reverseCharge: 'No'
  };

  const defaultItem = { hsn: '998314', desc: 'Information technology (IT) design and development services.', amountUSD: 2992.50 };
  const defaultFxRate = 86.50;
  const defaultLutId = 'LUT-2025-001';

  const [inv, setInv] = useState(() => {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('inv');
		return stored ? JSON.parse(stored) : defaultInv;
	}
	return defaultInv;
});
const [supplier, setSupplier] = useState(() => {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('supplier');
		return stored ? JSON.parse(stored) : defaultSupplier;
	}
	return defaultSupplier;
});
const [buyer, setBuyer] = useState(() => {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('buyer');
		return stored ? JSON.parse(stored) : defaultBuyer;
	}
	return defaultBuyer;
});
const [item, setItem] = useState(() => {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('item');
		return stored ? JSON.parse(stored) : defaultItem;
	}
	return defaultItem;
});
const [fxRate, setFxRate] = useState(() => {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('fxRate');
		return stored ? JSON.parse(stored) : defaultFxRate;
	}
	return defaultFxRate;
});
const [lutId] = useState(() => {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('lutId');
		return stored ? JSON.parse(stored) : defaultLutId;
	}
	return defaultLutId;
});
  const [amountINR, setAmountINR] = useState(item.amountUSD * fxRate);
  const [amountWords, setAmountWords] = useState('');
  const [mounted, setMounted] = useState(false);

  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // Save state changes to localStorage
  useEffect(() => {
    localStorage.setItem('inv', JSON.stringify(inv));
  }, [inv]);
  useEffect(() => {
    localStorage.setItem('supplier', JSON.stringify(supplier));
  }, [supplier]);
  useEffect(() => {
    localStorage.setItem('buyer', JSON.stringify(buyer));
  }, [buyer]);
  useEffect(() => {
    localStorage.setItem('item', JSON.stringify(item));
  }, [item]);
  useEffect(() => {
    localStorage.setItem('fxRate', JSON.stringify(fxRate));
  }, [fxRate]);
  useEffect(() => {
    localStorage.setItem('lutId', JSON.stringify(lutId));
  }, [lutId]);

  // Calculate words on load and on changes
  useEffect(() => {
    const rupees = Math.round(item.amountUSD * fxRate);
    setAmountINR(item.amountUSD * fxRate);
    setAmountWords(toWords(rupees));
  }, [item, fxRate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const generate = () => {
    // Recalc handled by useEffect
  };

  const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const downloadPdf = async () => {
    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current);
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
      const time = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      pdf.save(`invoice_${time}.pdf`);
    }
  };

  const downloadPng = async () => {
    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current);
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const time = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.href = imgData;
      link.download = `invoice_${time}.png`;
      link.click();
    }
  };

  return (
    <>
      <Head>
        <title>Export Invoice Generator</title>
      </Head>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold mb-6 text-center">Export of Services – GST Tax Invoice</h1>
          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="font-semibold">Invoice No.</label>
              <input value={inv.number} onChange={e => setInv({...inv, number: e.target.value})}
                className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">Invoice Date</label>
              <input type="date" value={inv.date} onChange={e => setInv({...inv, date: e.target.value})}
              className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <label className="font-semibold">Supplier Name</label>
              <input value={supplier.name} onChange={e => setSupplier({...supplier, name: e.target.value})}
                className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">Supplier GSTIN</label>
              <input value={supplier.gstin} onChange={e => setSupplier({...supplier, gstin: e.target.value})}
                className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">Supplier Address</label>
              <textarea rows={3} value={supplier.addr} onChange={e => setSupplier({...supplier, addr: e.target.value})}
                className="w-full mt-1 p-2 border rounded-xl whitespace-pre-line" />
            </div>
            <div className="md:col-span-2">
              <label className="font-semibold">Recipient Name</label>
              <input value={buyer.name} onChange={e => setBuyer({...buyer, name: e.target.value})}
                className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <label className="font-semibold">Recipient Address</label>
              <textarea rows={3} value={buyer.addr} onChange={e => setBuyer({...buyer, addr: e.target.value})}
                className="w-full mt-1 p-2 border rounded-xl whitespace-pre-line" />
            </div>
            <div>
              <label className="font-semibold">Recipient Country</label>
              <input value={buyer.country} onChange={e => setBuyer({...buyer, name: e.target.value})}
                className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">Recipient Currency</label>
              <input value={buyer.currency} onChange={e => setBuyer({...buyer, name: e.target.value})}
                className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">HSN / SAC</label>
              <input value={item.hsn} onChange={e => setItem({...item, hsn: e.target.value})}
                className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">Description</label>
              <input value={item.desc} onChange={e => setItem({...item, desc: e.target.value})}
                className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">Amount (USD)</label>
              <input type="number" step="0.01" value={item.amountUSD} onChange={e => setItem({...item, amountUSD: parseFloat(e.target.value)})}
                className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">FX Rate (₹ / USD)</label>
              <input type="number" step="0.0001" value={fxRate} onChange={e => setFxRate(parseFloat(e.target.value))}
                className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div className="md:col-span-2 text-center mt-4">
              <button onClick={generate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded-2xl shadow-lg">
                Generate Invoice
              </button>
            </div>
          </div>
          {/* Invoice */}
          <div ref={invoiceRef} id="invoice" className="border-2 border-dashed p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-center mb-4">TAX INVOICE</h2>
            <p className="text-center italic mb-6">(Export of Services under LUT – IGST Not Payable)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold">Supplier (Exporter)</h3>
                <p>{supplier.name}</p>
                <pre className="whitespace-pre-line text-sm">{supplier.addr}</pre>
                <p>GSTIN: {supplier.gstin}</p>
              </div>
              <div>
                <h3 className="font-semibold">Invoice Details</h3>
                <p>No.: {inv.number}</p>
                <p>Date: {formatDate(inv.date)}</p>
                <p>POS: 96 – Foreign Country</p>
                <p>Reverse Charge: No</p>
              </div>
            </div>
            <p className='text-sm mt-4 text-gray-600'>Letter of Undertaking (LUT) No.: {lutId}</p>
            <p className='text-sm text-gray-600'>Export Declaration (Rule 96A): “Supply meant for export under LUT without
            payment of integrated tax.”</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <h3 className="font-semibold">Recipient (Foreign Client)</h3>
                <p className='mb-0 pb-0'>{buyer.name}</p>
                <pre className="whitespace-pre-line text-sm">{buyer.addr}</pre>
              </div>

              <div>
                <h3 className="font-semibold">Recipient GSTIN: URP</h3>
                <p>Country: Brazil</p>
                <p>Currency: USD</p>
                <p>Conversion Rate (RBI TT-Selling): 1 USD = ₹{fxRate} ({formatDate(inv.date)})</p>
              </div>
            </div>
            <table className="w-full mt-6 text-sm border">
              <thead className="bg-gray-100 font-semibold">
                <tr>
                  <th className="p-2 border">S No</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">HSN</th>
                  <th className="p-2 border text-right">Amount (USD)</th>
                  <th className="p-2 border text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border">1</td>
                  <td className="p-2 border">{item.desc}</td>
                  <td className="p-2 border">{item.hsn}</td>
                  <td className="p-2 border text-right">{'$'+ item.amountUSD.toFixed(2)}</td>
                  <td className="p-2 border text-right">{'₹' + amountINR.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                </tr>
              </tbody>
              <tfoot className="font-semibold">
                <tr>
                  <td colSpan={4} className="p-2 border text-right">Invoice Total (INR)</td>
                  <td className="p-2 border text-right">{'₹' + amountINR.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-4 text-sm"><strong>Amount in words:</strong> {amountWords} only</p>
            <p className="mt-8 text-sm">* This supply is zero-rated under Section 16 of the IGST Act 2017 under LUT without payment of tax.</p>
            <div className="mt-10 text-right">
              <p>For {supplier.name}</p>
              <p className="italic">Authorised Signatory</p>
            </div>
          </div>
          {/* Download PDF Button */}
          <div className="text-center mt-6">
            <button onClick={downloadPdf} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-2xl shadow-lg mr-4">
              Download Invoice PDF
            </button>
            <button onClick={downloadPng} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-2xl shadow-lg">
              Download Invoice PNG
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
