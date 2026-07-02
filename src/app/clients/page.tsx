'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useClients } from '../../hooks/useClients'
import { Client } from '../../types/client'

const emptyForm = { name: '', email: '', address: '', country: '', currency: '' }

export default function ClientsPage() {
  const { data: session } = useSession()
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClients()
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openAdd = () => {
    setEditingClient(null)
    setFormData(emptyForm)
    setShowForm(true)
  }

  const openEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email || '',
      address: client.address,
      country: client.country,
      currency: client.currency,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingClient(null)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a client name')
      return
    }

    try {
      setSaving(true)
      const payload = {
        name: formData.name,
        email: formData.email || undefined,
        address: formData.address,
        country: formData.country,
        currency: formData.currency,
      }
      if (editingClient?.id) {
        await updateClient(editingClient.id, payload)
      } else {
        await createClient(payload)
      }
      closeForm()
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Failed to save client. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (client: Client) => {
    if (window.confirm('Delete this client? Existing invoices are not affected.')) {
      try {
        setDeletingId(client.id!)
        await deleteClient(client.id!)
      } catch (error) {
        console.error('Error deleting client:', error)
        alert('Failed to delete client. Please try again.')
      } finally {
        setDeletingId(null)
      }
    }
  }

  const renderContent = () => {
    if (!session) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Please sign in to manage your clients</p>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Clients</h2>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading clients...</span>
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
          <h2 className="text-2xl font-bold text-gray-900">Your Clients</h2>
          <div className="text-sm text-gray-500">
            {clients.length} client{clients.length !== 1 ? 's' : ''}
            <button
              onClick={openAdd}
              className="bg-teal-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-lg ml-3"
            >
              Add Client
            </button>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No saved clients yet</h3>
            <p className="mt-1 text-sm text-gray-500">Clients are saved automatically when you create an invoice.</p>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100 font-semibold">
                <tr>
                  <th className="p-2 border text-left">Name</th>
                  <th className="p-2 border text-left">Email</th>
                  <th className="p-2 border text-left">Country</th>
                  <th className="p-2 border text-left">Currency</th>
                  <th className="p-2 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="p-2 border font-medium text-gray-900">{client.name}</td>
                    <td className="p-2 border text-gray-500">{client.email}</td>
                    <td className="p-2 border text-gray-500">{client.country}</td>
                    <td className="p-2 border text-gray-500">{client.currency}</td>
                    <td className="p-2 border text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(client)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          disabled={deletingId === client.id}
                          className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                        >
                          {deletingId === client.id ? 'Deleting...' : 'Delete'}
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
                <h3 className="text-lg font-semibold">{editingClient ? 'Edit Client' : 'Add Client'}</h3>
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
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
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
