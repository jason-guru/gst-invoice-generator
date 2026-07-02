'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSuppliers } from '../../hooks/useSuppliers'
import { Supplier } from '../../types/supplier'

const emptyForm = { name: '', address: '', gstin: '' }

export default function SuppliersPage() {
  const { data: session } = useSession()
  const { suppliers, loading, error, createSupplier, updateSupplier, deleteSupplier } = useSuppliers()
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openAdd = () => {
    setEditingSupplier(null)
    setFormData(emptyForm)
    setShowForm(true)
  }

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      address: supplier.address,
      gstin: supplier.gstin,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingSupplier(null)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a supplier name')
      return
    }

    try {
      setSaving(true)
      if (editingSupplier?.id) {
        await updateSupplier(editingSupplier.id, formData)
      } else {
        await createSupplier(formData)
      }
      closeForm()
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Failed to save supplier. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm('Delete this supplier? Existing invoices are not affected.')) {
      try {
        setDeletingId(supplier.id!)
        await deleteSupplier(supplier.id!)
      } catch (error) {
        console.error('Error deleting supplier:', error)
        alert('Failed to delete supplier. Please try again.')
      } finally {
        setDeletingId(null)
      }
    }
  }

  const renderContent = () => {
    if (!session) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Please sign in to manage your suppliers</p>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Suppliers</h2>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading suppliers...</span>
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
          <h2 className="text-2xl font-bold text-gray-900">Your Suppliers</h2>
          <div className="text-sm text-gray-500">
            {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
            <button
              onClick={openAdd}
              className="bg-teal-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-lg ml-3"
            >
              Add Supplier
            </button>
          </div>
        </div>

        {suppliers.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No saved suppliers yet</h3>
            <p className="mt-1 text-sm text-gray-500">Suppliers are saved automatically when you create an invoice.</p>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100 font-semibold">
                <tr>
                  <th className="p-2 border text-left">Name</th>
                  <th className="p-2 border text-left">GSTIN</th>
                  <th className="p-2 border text-left">Address</th>
                  <th className="p-2 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="p-2 border font-medium text-gray-900">{supplier.name}</td>
                    <td className="p-2 border text-gray-500">{supplier.gstin}</td>
                    <td className="p-2 border text-gray-500 whitespace-pre-line">{supplier.address}</td>
                    <td className="p-2 border text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(supplier)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
                          disabled={deletingId === supplier.id}
                          className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                        >
                          {deletingId === supplier.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg max-h-[90vh] overflow-y-auto w-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
                <button
                  onClick={closeForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={closeForm}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 md:p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
        {renderContent()}
      </div>
    </div>
  )
}
