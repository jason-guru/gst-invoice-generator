'use client';

import { useState, useRef } from 'react';
import Head from 'next/head';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

export default function RCMInvoice() {
  const [inv, setInv] = useState({ number: 'SI/RCM/2025/001', date: new Date().toISOString().slice(0,10) });
  const [supplier, setSupplier] = useState({
    name: 'Deel Inc.',
    addr: '123 Market Street, San Francisco, CA, USA'
  });
  const [item, setItem] = useState({ desc: 'Provider fee charged by Deel Inc. for June 2025', sac: '998599', amountUSD: 89.10 });
  const [fxRate, setFxRate] = useState(83.10);
  const previewRef = useRef<HTMLDivElement>(null);

  const amountINR = (item.amountUSD * fxRate).toFixed(2);
  const igst = (item.amountUSD * fxRate * 0.18).toFixed(2);

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 20; // 20 points margin on all sides
      const imgWidth = 210 - (margin * 2); // Account for left and right margins
      const pageHeight = 295 - (margin * 2); // Account for top and bottom margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = margin; // Start at top margin
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin; // Maintain margin for additional pages
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`RCM-Self-Invoice-${inv.number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>RCM Self-Invoice Generator</title>
      </Head>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold mb-6 text-center">RCM Self-Invoice for Import of Service</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="font-semibold">Invoice No.</label>
              <input value={inv.number} onChange={e => setInv({...inv, number: e.target.value})} className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">Date</label>
              <input type="date" value={inv.date} onChange={e => setInv({...inv, date: e.target.value})} className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <label className="font-semibold">Foreign Supplier Name</label>
              <input value={supplier.name} onChange={e => setSupplier({...supplier, name: e.target.value})} className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <label className="font-semibold">Supplier Address</label>
              <textarea rows={2} value={supplier.addr} onChange={e => setSupplier({...supplier, addr: e.target.value})} className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <label className="font-semibold">Description of Service</label>
              <input value={item.desc} onChange={e => setItem({...item, desc: e.target.value})} className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">SAC</label>
              <input value={item.sac} onChange={e => setItem({...item, sac: e.target.value})} className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">Amount (USD)</label>
              <input type="number" value={item.amountUSD} onChange={e => setItem({...item, amountUSD: parseFloat(e.target.value)})} className="w-full mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="font-semibold">FX Rate (₹ / USD)</label>
              <input type="number" value={fxRate} onChange={e => setFxRate(parseFloat(e.target.value))} className="w-full mt-1 p-2 border rounded-xl" />
            </div>
          </div>

          <div ref={previewRef} className="border-2 border-dashed p-4 rounded-2xl">
            <h2 className="text-lg font-bold mb-2">RCM Self-Invoice</h2>
            <p><strong>Invoice No.:</strong> {inv.number}</p>
            <p><strong>Date:</strong> {inv.date}</p>
            <p><strong>Supplier:</strong> {supplier.name}</p>
            <p><strong>Supplier Address:</strong> {supplier.addr}</p>
            <p><strong>Particulars:</strong> {item.desc}</p>
            <p><strong>SAC:</strong> {item.sac}</p>
            <p><strong>Amount (USD):</strong> {item.amountUSD.toFixed(2)}</p>
            <p><strong>Amount in INR:</strong> ₹{amountINR}</p>
            <p><strong>IGST @18% payable under RCM:</strong> ₹{igst}</p>
          </div>

          <div className="mt-6 text-center">
            <button 
              onClick={downloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
