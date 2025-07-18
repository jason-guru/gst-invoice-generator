'use client'

import { useInvoices } from '../hooks/useInvoices'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { useState, useRef } from 'react'
import { Invoice, InvoiceItem } from '../services/invoiceService'
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import Image from 'next/image'
// import ImageUploader from './ImageUploader'

export default function InvoiceList() {
  const { data: session } = useSession()
  const { invoices, loading, error, deleteInvoice, updateInvoice, createInvoice, refreshInvoices } = useInvoices()
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Invoice | null>(null)
  const [saving, setSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createFormData, setCreateFormData] = useState({
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
    notes: ''
  });
  const invoiceRef = useRef<HTMLDivElement>(null);

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

  const authorizedSignature = "data:image/jpeg;base64,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TWJvb2wAAAAAAENybkNib29sAAAAAABDbnRDYm9vbAAAAAAATGJsc2Jvb2wAAAAAAE5ndHZib29sAAAAAABFbWxEYm9vbAAAAAAASW50cmJvb2wAAAAAAEJja2dPYmpjAAAAAQAAAAAAAFJHQkMAAAADAAAAAFJkICBkb3ViQG/gAAAAAAAAAAAAR3JuIGRvdWJAb+AAAAAAAAAAAABCbCAgZG91YkBv4AAAAAAAAAAAAEJyZFRVbnRGI1JsdAAAAAAAAAAAAAAAAEJsZCBVbnRGI1JsdAAAAAAAAAAAAAAAAFJzbHRVbnRGI1B4bEBSAAAAAAAAAAAACnZlY3RvckRhdGFib29sAQAAAABQZ1BzZW51bQAAAABQZ1BzAAAAAFBnUEMAAAAATGVmdFVudEYjUmx0AAAAAAAAAAAAAAAAVG9wIFVudEYjUmx0AAAAAAAAAAAAAAAAU2NsIFVudEYjUHJjQFkAAAAAAAAAAAAQY3JvcFdoZW5QcmludGluZ2Jvb2wAAAAADmNyb3BSZWN0Qm90dG9tbG9uZwAAAAAAAAAMY3JvcFJlY3RMZWZ0bG9uZwAAAAAAAAANY3JvcFJlY3RSaWdodGxvbmcAAAAAAAAAC2Nyb3BSZWN0VG9wbG9uZwAAAAAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQQNAAAAAAAEAAAAHjhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAThCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADVQAAAAYAAAAAAAAAAAAAADwA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qGD0xu/qeWC2hxbLKW8WZuS76LaqPzGf9qLv0LFqJJKavS+nUdM6fRgY8mvHYGhx+k4/Ssts/wCEtsLrbP5atJJJKUkkkkpSSSSSlJJJJKUkkkkp/9kAOEJJTQQhAAAAAABVAAAAAQEAAAAPAEEAZABvAGIAZQAgAFAAaABvAHQAbwBzAGgAbwBwAAAAEwBBAGQAbwBiAGUAIABQAGgAbwB0AG8AcwBoAG8AcAAgAEMAUwA2AAAAAQA4QklNBAYAAAAAAAf//AAAAAEBAP/hDX1odHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9IjA2QUE1NzRDQUQzMjAxMEExMzMwQzY0NDQ2OTVBQzhCIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjNDNUFERTYxQTdBMEU1MTE5RUREQjc5OTUwNzJCQTIxIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9IjA2QUE1NzRDQUQzMjAxMEExMzMwQzY0NDQ2OTVBQzhCIiBkYzpmb3JtYXQ9ImltYWdlL2pwZWciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHhtcDpDcmVhdGVEYXRlPSIyMDE1LTEyLTEyVDEzOjM2OjA1KzA1OjMwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxNS0xMi0xMlQxMzozNzoyNiswNTozMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxNS0xMi0xMlQxMzozNzoyNiswNTozMCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjNCNUFERTYxQTdBMEU1MTE5RUREQjc5OTUwNzJCQTIxIiBzdEV2dDp3aGVuPSIyMDE1LTEyLTEyVDEzOjM3OjI2KzA1OjMwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6M0M1QURFNjFBN0EwRTUxMTlFRERCNzk5NTA3MkJBMjEiIHN0RXZ0OndoZW49IjIwMTUtMTItMTJUMTM6Mzc6MjYrMDU6MzAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+/+4ADkFkb2JlAGSAAAAAAf/bAIQAICEhMyQzUTAwUUIvLy9CJxwcHBwnIhcXFxcXIhEMDAwMDAwRDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAEiMzM0JjQiGBgiFA4ODhQUDg4ODhQRDAwMDAwREQwMDAwMDBEMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM/8AAEQgAPACMAwEiAAIRAQMRAf/dAAQACf/EARsAAAMBAQEBAQEBAQEAAAAAAAEAAgMEBQYHCAkKCwEBAQEBAQEBAQEBAQEAAAAAAAECAwQFBgcICQoLEAACAgEDAgMEBwYDAwYCATUBAAIRAyESMQRBUSITYXEygZGxQqEF0cEU8FIjcjNi4YLxQzSSorIV0lMkc8JjBoOT4vKjRFRkJTVFFiZ0NlVls4TD03Xj80aUpIW0lcTU5PSltcXV5fVWZnaGlqa2xtbm9hEAAgIABQEGBgEDAQMFAwYvAAERAiEDMUESUWFxgZEiEzLwobEEwdHh8UJSI2JyFJIzgkMkorI0U0Rjc8LSg5OjVOLyBRUlBhYmNWRFVTZ0ZbOEw9N14/NGlKSFtJXE1OT0pbXF1eX1VmZ2hv/aAAwDAQACEQMRAD8A+gVVQFVePqMp9THiiSDKXqZf/EY/U/k/+9eX/wBB48qB2KqoCqqgKq8ZyGWWO2XkBnini2/Hkhj9bL62b/yj/wCD+n6P/lT1EDsVVQFVVAVVUBVVQP/Q+gVVQF8vD/Nzifsy5/8ARKf/AFT+Gf8AzL03W9T/AO9D6UjQ/wCb/qfO6MkRnIfZGLpY7vJ/N6XH/N/82dd1GRA9NmUhEWTQfM6ic5eaMjfT+nPPCHwT+Dqeq/8AHfyf++/lYcf+7yPVmEeo/lA/w5cnp/Y/3/Rf+bs3p5//ABOJA63OeWGP4yI3/HLa44s8pYfUrdKIyf2/N62TB6mL/wAE/wDKfVej/JePH0h9GMTHz5Jb+snL+76Mz+29T03/AH3/AHHSekgeqSALPA8z5fRgkxke0J9Vkl/5W/EMn7Tj/wDNfRYV6qE+nxT9OjimPT9CX/ovk6j/AME/9Rn/AKb/AM//AID/AHP9zpsv+4dco/Zunl9qZAx/+MzZI4+gw+l/3f8Au/Sx/wC7xY0DuhMTiJDiQ3x/1NPGM37P5Mg24wB6OaO6ePyD/her/wDSfqf+6yf8P1P/AI/+S8fS58oBymM8kMu704/3MkMu7/5i/D+q/t4v9x037P8A+VkD1ROMiYg6x+P/AAbv5v8A7raJrl4Z9KdhlDy9Rfq+re3+bOX9vN/6UdL6f8j0M2LLh9L/AHaR0hMvPLfAiMs2L7PUdVH/ANGcv/pp/wCmGP8AkepixIHc5HNCPMh/yvM4jo8XcGX/AIzJlyR/81Zs3pvRGEYfCBH+iO1AoG9QlVQP/9H6BVVA55G8oj2hGWaX/wBDYP8A6qeXosUpRGSUvLI5Oohh2/8AfznlxZuqz/8Aoz/L/m4P5eH0/wDyojLkI9aXf+V0uKP+PJD+T/8ANP4k9+KHpwjD+GMYf8iPpoEwwQhKUhzlO7J/7rTDDDHHbGIjE/Zi6qgAAAUNAlVQOLqvNPHj/in60v8AxfSR/af/AKJ/ZXrMRLkXXm/1f948uL+bmlk+zD/wXF/7v/Ecv/m/0el/95cj2ICqqgKqqAqqoCqqgf/S+gVVQOCWHJLNr/a3R6nd9r1ceP8AZMPQel/43/w/1/8AzE96qgKqqAuGecgNmP8AuT+D+DF/6e9T/wCUsH/zRm/ku6oGeLGMUBAcR/f1f/GZf7uR0VUBVVQFVVAVVUBVVQP/2Q=="


  const handleView = (invoice: Invoice) => {
    setViewingInvoice(invoice)
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setEditFormData({ ...invoice })
  }

  const handleSaveEdit = async () => {
    if (!editFormData || !editFormData.id) return
    
    try {
      setSaving(true)
      await updateInvoice(editFormData.id, editFormData)
      setEditingInvoice(null)
      setEditFormData(null)
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Failed to update invoice. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof Invoice, value: any) => {
    if (!editFormData) return
    setEditFormData({ ...editFormData, [field]: value })
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    if (!editFormData) return
    const newItems = [...editFormData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setEditFormData({ ...editFormData, items: newItems })
  }

  const addItem = () => {
    if (!editFormData) return
    const newItem: InvoiceItem = {
      description: '',
      hsn: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setEditFormData({ ...editFormData, items: [...editFormData.items, newItem] })
  }

  const removeItem = (index: number) => {
    if (!editFormData) return
    const newItems = editFormData.items.filter((_, i) => i !== index)
    setEditFormData({ ...editFormData, items: newItems })
  }

  const handleDelete = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        setDeletingInvoice(invoiceId)
        await deleteInvoice(invoiceId)
      } catch (error) {
        console.error('Error deleting invoice:', error)
        alert('Failed to delete invoice. Please try again.')
      } finally {
        setDeletingInvoice(null)
      }
    }
  }

  const handleCreateInputChange = (field: string, value: any) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateItemChange = (index: number, field: string, value: any) => {
    const newItems = [...createFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'rate' || field === 'quantity') {
      newItems[index].amount = newItems[index].rate * newItems[index].quantity;
    }
    setCreateFormData(prev => ({ ...prev, items: newItems }));
  };

  const addCreateItem = () => {
    setCreateFormData(prev => ({
      ...prev,
      items: [...prev.items, { hsn: '', description: '', quantity: 1, rate: 0, amount: 0 }]
    }));
  };

  const removeCreateItem = (index: number) => {
    if (createFormData.items.length > 1) {
      setCreateFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleCreateInvoice = async () => {
    const userId = (session?.user as any)?.id;
    if (!userId) {
      alert('Please sign in to create an invoice');
      return;
    }

    try {
      setSaving(true);
      const invoiceData = {
        invoiceNumber: createFormData.invoiceNumber,
        invoiceDate: new Date(createFormData.invoiceDate),
        supplierName: createFormData.supplierName,
        supplierAddress: createFormData.supplierAddress,
        supplierGSTIN: createFormData.supplierGSTIN,
        recipientName: createFormData.recipientName,
        recipientEmail: createFormData.recipientEmail,
        recipientAddress: createFormData.recipientAddress,
        recipientCountry: createFormData.recipientCountry,
        recipientCurrency: createFormData.recipientCurrency,
        fxRate: createFormData.fxRate,
        lutId: createFormData.lutId,
        items: createFormData.items,
        notes: createFormData.notes
      };
      
      await createInvoice(invoiceData);
      await refreshInvoices();
      setShowCreateModal(false);
      // Reset form
      setCreateFormData({
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
        notes: ''
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">Please sign in to view your saved invoices</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Your Invoices</h2>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading invoices...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Invoices</h2>
        <div className="text-sm text-gray-500">
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          {invoices.length > 0 && (
            <span className="ml-2">
              (Showing {Math.min(5, invoices.length)} of {invoices.length})
            </span>
          )}
          <button
              onClick={() => setShowCreateModal(true)}
              className="bg-teal-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-lg ml-3"
            >
              Create New Invoice
            </button>
        </div>
      </div>

      {/* <ImageUploader/> */}
      
      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first invoice above.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                  </div>
                  <p className="text-gray-700 font-medium">{invoice.recipientName}</p>
                  {invoice.recipientEmail && (
                    <p className="text-sm text-gray-500">{invoice.recipientEmail}</p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Created {formatDistanceToNow(invoice.createdAt, { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{invoice.items.reduce((sum, item) => sum + (item.amount * invoice.fxRate), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={() => handleView(invoice)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEdit(invoice)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(invoice.id!)}
                      disabled={deletingInvoice === invoice.id}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                      {deletingInvoice === invoice.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
              
              {invoice.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* View Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl max-h-[100vh] overflow-y-auto w-full">
            <div className="flex justify-between items-center p-1 px-4 border-b">
              <h3 className="text-lg font-semibold">Invoice Details</h3>
              <button 
                onClick={() => setViewingInvoice(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1">
                <div>
                  <div ref={invoiceRef} id="invoice" className="border-2 border-dashed p-6 rounded-2xl scale-100 width-full md:scale-100">
                    <h2 className="text-xl font-bold text-center mb-4">TAX INVOICE</h2>
                    <p className="text-center italic mb-6">(Export of Services under LUT – IGST Not Payable)</p>
                    <div className="grid grid-cols-1 grid-cols-2 gap-4 text-sm">
                      <div>
                        <h3 className="font-semibold">Supplier (Exporter)</h3>
                        <p>{viewingInvoice.supplierName}</p>
                        <pre className="whitespace-pre-line text-sm">{viewingInvoice.supplierAddress}</pre>
                        <p>GSTIN: {viewingInvoice.supplierGSTIN}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold">Invoice Details</h3>
                        <p>No.: {viewingInvoice.invoiceNumber}</p>
                        <p>Date: {typeof viewingInvoice.invoiceDate === 'string' ? viewingInvoice.invoiceDate : new Date(viewingInvoice.invoiceDate).toLocaleDateString('en-GB')}</p>
                        <p>POS: 96 – Foreign Country</p>
                        <p>Reverse Charge: No</p>
                      </div>
                    </div>
                    <p className='text-sm mt-4 text-gray-600'>Letter of Undertaking (LUT) No.: {viewingInvoice.lutId}</p>
                    <p className='text-sm text-gray-600'>Export Declaration (Rule 96A): “Supply meant for export under LUT without
                    payment of integrated tax.”</p>
                    <div className="grid grid-cols-1 grid-cols-2 gap-4 text-sm mt-4">
                      <div>
                        <h3 className="font-semibold">Recipient (Foreign Client)</h3>
                        <p className='mb-0 pb-0'>{viewingInvoice.recipientName}</p>
                        <pre className="whitespace-pre-line text-sm">{viewingInvoice.recipientAddress}</pre>
                      </div>

                      <div>
                        <h3 className="font-semibold">Recipient GSTIN: URP</h3>
                        <p>Country: Brazil</p>
                        <p>Currency: USD</p>
                        <p>Conversion Rate (RBI TT-Selling): 1 USD = ₹{viewingInvoice.fxRate} ({typeof viewingInvoice.invoiceDate === 'string' ? viewingInvoice.invoiceDate : new Date(viewingInvoice.invoiceDate).toLocaleDateString('en-GB')})</p>
                      </div>
                    </div>
                    <div className="relative overflow-x-auto">
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
                          {viewingInvoice.items.map((item, index) => {
                            const amountINR = item.amount * viewingInvoice.fxRate;
                            return (
                              <tr key={index}>
                                <td className="p-2 border">{index + 1}</td>
                                <td className="p-2 border">{item.description}</td>
                                <td className="p-2 border">{item.hsn}</td>
                                <td className="p-2 border text-right">{'$' + item.amount.toFixed(2)}</td>
                                <td className="p-2 border text-right">{'₹' + amountINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="font-semibold">
                          <tr>
                            <td colSpan={4} className="p-2 border text-right">Invoice Total (INR)</td>
                            <td className="p-2 border text-right">{'₹' + (viewingInvoice.items.reduce((acc, item) => acc + item.amount * viewingInvoice.fxRate, 0)).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <p className="mt-4 text-sm"><strong>Amount in words:</strong> {toWords(viewingInvoice.items.reduce((acc, item) => acc + item.amount * viewingInvoice.fxRate, 0))} only</p>
                    <p className="mt-8 text-sm">* This supply is zero-rated under Section 16 of the IGST Act 2017 under LUT without payment of tax.</p>
                    <div className="mt-10 text-right">
                      <div className='flex flex-col items-end'>
                        <Image 
                          src={authorizedSignature} 
                          alt="Signature" 
                          width={100}
                          height={50}
                          className="rounded-full mr-10"
                        />
                      </div>
                      
                      <p>For {viewingInvoice.supplierName}</p>
                      <p className="italic">Authorised Signatory</p>
                    </div>
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
              {/* {viewingInvoice.notes && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-gray-700">{viewingInvoice.notes}</p>
                </div>
              )} */}
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Edit Invoice</h3>
              <button 
                onClick={() => {
                  setEditingInvoice(null)
                  setEditFormData(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Invoice Information */}
                <div>
                  <h4 className="font-semibold mb-4">Invoice Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                      <input
                        type="text"
                        value={editFormData.invoiceNumber}
                        onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
                      <input
                        type="date"
                        value={new Date(editFormData.invoiceDate).toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('invoiceDate', new Date(e.target.value))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">FX Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.fxRate}
                        onChange={(e) => handleInputChange('fxRate', parseFloat(e.target.value))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">LUT ID</label>
                      <input
                        type="text"
                        value={editFormData.lutId}
                        onChange={(e) => handleInputChange('lutId', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Supplier Information */}
                <div>
                  <h4 className="font-semibold mb-4">Supplier Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                      <input
                        type="text"
                        value={editFormData.supplierName}
                        onChange={(e) => handleInputChange('supplierName', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier GSTIN</label>
                      <input
                        type="text"
                        value={editFormData.supplierGSTIN}
                        onChange={(e) => handleInputChange('supplierGSTIN', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier Address</label>
                      <textarea
                        rows={3}
                        value={editFormData.supplierAddress}
                        onChange={(e) => handleInputChange('supplierAddress', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Recipient Information */}
                <div>
                  <h4 className="font-semibold mb-4">Recipient Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
                      <input
                        type="text"
                        value={editFormData.recipientName}
                        onChange={(e) => handleInputChange('recipientName', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
                      <input
                        type="email"
                        value={editFormData.recipientEmail || ''}
                        onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Recipient Address</label>
                      <textarea
                        rows={3}
                        value={editFormData.recipientAddress}
                        onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Country</label>
                      <input
                        type="text"
                        value={editFormData.recipientCountry}
                        onChange={(e) => handleInputChange('recipientCountry', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <input
                        type="text"
                        value={editFormData.recipientCurrency}
                        onChange={(e) => handleInputChange('recipientCurrency', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Items</h4>
                    <button
                      onClick={addItem}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Add Item
                    </button>
                  </div>
                  <div className="space-y-4">
                    {editFormData.items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium">Item {index + 1}</h5>
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">HSN</label>
                            <input
                              type="text"
                              value={item.hsn}
                              onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Rate (USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Amount (USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value))}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      rows={3}
                      value={editFormData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setEditingInvoice(null)
                    setEditFormData(null)
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto w-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold">Create New Invoice</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Invoice Information */}
                  <div>
                    <h4 className="font-semibold mb-4">Invoice Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                        <input
                          type="text"
                          value={createFormData.invoiceNumber}
                          onChange={(e) => handleCreateInputChange('invoiceNumber', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
                        <input
                          type="date"
                          value={createFormData.invoiceDate}
                          onChange={(e) => handleCreateInputChange('invoiceDate', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">FX Rate</label>
                        <input
                          type="number"
                          step="0.01"
                          value={createFormData.fxRate}
                          onChange={(e) => handleCreateInputChange('fxRate', parseFloat(e.target.value))}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">LUT ID</label>
                        <input
                          type="text"
                          value={createFormData.lutId}
                          onChange={(e) => handleCreateInputChange('lutId', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Supplier Information */}
                  <div>
                    <h4 className="font-semibold mb-4">Supplier Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                        <input
                          type="text"
                          value={createFormData.supplierName}
                          onChange={(e) => handleCreateInputChange('supplierName', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier GSTIN</label>
                        <input
                          type="text"
                          value={createFormData.supplierGSTIN}
                          onChange={(e) => handleCreateInputChange('supplierGSTIN', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier Address</label>
                        <textarea
                          rows={3}
                          value={createFormData.supplierAddress}
                          onChange={(e) => handleCreateInputChange('supplierAddress', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recipient Information */}
                  <div>
                    <h4 className="font-semibold mb-4">Recipient Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
                        <input
                          type="text"
                          value={createFormData.recipientName}
                          onChange={(e) => handleCreateInputChange('recipientName', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
                        <input
                          type="email"
                          value={createFormData.recipientEmail}
                          onChange={(e) => handleCreateInputChange('recipientEmail', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Recipient Address</label>
                        <textarea
                          rows={3}
                          value={createFormData.recipientAddress}
                          onChange={(e) => handleCreateInputChange('recipientAddress', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <input
                          type="text"
                          value={createFormData.recipientCountry}
                          onChange={(e) => handleCreateInputChange('recipientCountry', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                        <input
                          type="text"
                          value={createFormData.recipientCurrency}
                          onChange={(e) => handleCreateInputChange('recipientCurrency', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold">Items</h4>
                      <button
                        onClick={addCreateItem}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Add Item
                      </button>
                    </div>
                    <div className="space-y-4">
                      {createFormData.items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-medium">Item {index + 1}</h5>
                            {createFormData.items.length > 1 && (
                              <button
                                onClick={() => removeCreateItem(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Description</label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleCreateItemChange(index, 'description', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">HSN</label>
                              <input
                                type="text"
                                value={item.hsn}
                                onChange={(e) => handleCreateItemChange(index, 'hsn', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Quantity</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleCreateItemChange(index, 'quantity', parseFloat(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Rate</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => handleCreateItemChange(index, 'rate', parseFloat(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Amount</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.amount}
                                readOnly
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        rows={3}
                        value={createFormData.notes}
                        onChange={(e) => handleCreateInputChange('notes', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateInvoice}
                    disabled={saving}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded"
                  >
                    {saving ? 'Creating...' : 'Create Invoice'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
