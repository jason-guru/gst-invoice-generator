'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import InvoiceList from '../components/InvoiceList';
import { useInvoices } from '../hooks/useInvoices';
import { useSession } from 'next-auth/react';

export default function Home() {
  // State for create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: session } = useSession();
  const { createInvoice, refreshInvoices } = useInvoices();
  
  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Export Invoice Generator</title>
      </Head>
      <div className="min-h-screen bg-gray-50 md:p-6">
        <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold mb-6 text-center">Export of Services – GST Tax Invoice</h1>
          
          {/* Create Invoice Button */}
          <div className="text-center mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-2xl shadow-lg"
            >
              Create New Invoice
            </button>
          </div>
        </div>
        
        {/* Invoice List */}
        <div className="max-w-5xl mx-auto mt-8 bg-white p-6 rounded-2xl shadow-xl">
          <InvoiceList />
        </div>

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
    </>
  );
}
