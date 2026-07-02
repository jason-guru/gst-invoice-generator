'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useInvoices } from '../../hooks/useInvoices'
import { useClients } from '../../hooks/useClients'
import { useSuppliers } from '../../hooks/useSuppliers'
import { InvoiceFormValues, emptyInvoiceFormValues } from '../../lib/invoiceUtils'
import SavedEntitySelect from './SavedEntitySelect'

// The create-invoice form. Supplier and recipient sections start from a saved
// entry (picked from the dropdowns) or from blank fields; either way the
// fields stay editable. Editing the name detaches the form from the picked
// entry, because the server dedupes auto-saved entries by name.
export default function InvoiceForm({
  initialValues,
}: {
  initialValues?: Partial<InvoiceFormValues>
}) {
  const router = useRouter()
  const { data: session } = useSession()
  const { createInvoice } = useInvoices()
  const { clients, refreshClients } = useClients()
  const { suppliers, refreshSuppliers } = useSuppliers()
  const [formData, setFormData] = useState<InvoiceFormValues>({
    ...emptyInvoiceFormValues(),
    ...initialValues,
  })
  const [saving, setSaving] = useState(false)

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }
      // The name is the auto-save dedupe key: once it's edited, the form no
      // longer represents the picked entry.
      if (field === 'supplierName') next.supplierId = ''
      if (field === 'recipientName') next.clientId = ''
      return next
    })
  }

  const handleItemChange = (index: number, field: string, value: unknown) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'rate' || field === 'quantity') {
      newItems[index].amount = newItems[index].rate * newItems[index].quantity
    }
    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { hsn: '', description: '', quantity: 1, rate: 0, amount: 0 }]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSelectSupplier = (id: string) => {
    if (!id) {
      setFormData(prev => ({ ...prev, supplierId: '' }))
      return
    }
    const supplier = suppliers.find(s => s.id === id)
    if (!supplier) return
    setFormData(prev => ({
      ...prev,
      supplierId: id,
      supplierName: supplier.name,
      supplierGSTIN: supplier.gstin,
      supplierAddress: supplier.address,
    }))
  }

  const handleSelectClient = (id: string) => {
    if (!id) {
      setFormData(prev => ({ ...prev, clientId: '' }))
      return
    }
    const client = clients.find(c => c.id === id)
    if (!client) return
    setFormData(prev => ({
      ...prev,
      clientId: id,
      recipientName: client.name,
      recipientEmail: client.email || '',
      recipientAddress: client.address,
      recipientCountry: client.country,
      recipientCurrency: client.currency,
    }))
  }

  const handleSubmit = async () => {
    const userId = (session?.user as { id?: string })?.id
    if (!userId) {
      alert('Please sign in to create an invoice')
      return
    }

    try {
      setSaving(true)
      await createInvoice({
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: new Date(formData.invoiceDate),
        supplierName: formData.supplierName,
        supplierAddress: formData.supplierAddress,
        supplierGSTIN: formData.supplierGSTIN,
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        recipientAddress: formData.recipientAddress,
        recipientCountry: formData.recipientCountry,
        recipientCurrency: formData.recipientCurrency,
        fxRate: formData.fxRate,
        lutId: formData.lutId,
        items: formData.items,
        notes: formData.notes,
        supplierId: formData.supplierId || undefined,
        clientId: formData.clientId || undefined,
      })
      // The server may have auto-saved a new supplier/client; refresh the
      // lists in the background so the pickers pick them up.
      refreshSuppliers()
      refreshClients()
      router.push('/invoices')
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Information */}
        <div>
          <h4 className="font-semibold mb-4">Invoice Information</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">FX Rate</label>
              <input
                type="number"
                step="0.01"
                value={formData.fxRate}
                onChange={(e) => handleInputChange('fxRate', parseFloat(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">LUT ID</label>
              <input
                type="text"
                value={formData.lutId}
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
            <SavedEntitySelect
              label="Use saved supplier"
              newLabel="New supplier…"
              options={suppliers.map(s => ({ id: s.id!, name: s.name }))}
              selectedId={formData.supplierId}
              onChange={handleSelectSupplier}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
              <input
                type="text"
                value={formData.supplierName}
                onChange={(e) => handleInputChange('supplierName', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier GSTIN</label>
              <input
                type="text"
                value={formData.supplierGSTIN}
                onChange={(e) => handleInputChange('supplierGSTIN', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier Address</label>
              <textarea
                rows={3}
                value={formData.supplierAddress}
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
            <SavedEntitySelect
              label="Use saved client"
              newLabel="New client…"
              options={clients.map(c => ({ id: c.id!, name: c.name }))}
              selectedId={formData.clientId}
              onChange={handleSelectClient}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => handleInputChange('recipientName', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
              <input
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Recipient Address</label>
              <textarea
                rows={3}
                value={formData.recipientAddress}
                onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                value={formData.recipientCountry}
                onChange={(e) => handleInputChange('recipientCountry', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <input
                type="text"
                value={formData.recipientCurrency}
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
            {formData.items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-medium">Item {index + 1}</h5>
                  {formData.items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
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
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))}
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
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
        <button
          onClick={() => router.push('/invoices')}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded"
        >
          {saving ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>
    </div>
  )
}
