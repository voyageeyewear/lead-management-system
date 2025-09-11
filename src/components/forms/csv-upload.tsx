'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, X, CheckCircle, AlertCircle, Users } from 'lucide-react'

interface CSVUploadProps {
  onClose: () => void
  onSuccess: () => void
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function CSVUpload({ onClose, onSuccess }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [defaultAssignee, setDefaultAssignee] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        const response = await fetch('/api/users?limit=100', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    fetchUsers()
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      parseCSV(selectedFile)
    } else {
      alert('Please select a valid CSV file')
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      const data = []
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim())
          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          data.push(row)
        }
      }
      
      setCsvData(data)
      setShowPreview(true)
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (!file || csvData.length === 0) {
      alert('Please select a CSV file first')
      return
    }

    setIsLoading(true)
    setUploadResult(null)

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leads: csvData,
          defaultAssignedToId: defaultAssignee,
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        setUploadResult(result)
        if (result.results.successful > 0) {
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 3000)
        }
      } else {
        alert(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('An error occurred during upload')
    } finally {
      setIsLoading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setCsvData([])
    setShowPreview(false)
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Import Leads from CSV
              </CardTitle>
              <CardDescription>
                Upload a CSV file to bulk import leads. Expected format: full_name, phone_number, company_name, city
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csvFile">Select CSV File</Label>
              <div className="flex items-center space-x-2">
                <Input
                  ref={fileInputRef}
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                {file && (
                  <Button variant="outline" size="icon" onClick={removeFile}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {file && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <FileText className="h-4 w-4" />
                <span>{file.name} ({csvData.length} records)</span>
              </div>
            )}
          </div>

          {/* Default Assignee Selection */}
          <div className="space-y-2">
            <Label htmlFor="defaultAssignee">Default Assignee (Optional)</Label>
            <Select value={defaultAssignee} onValueChange={setDefaultAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select default assignee for all leads" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{user.name} ({user.role})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              If not selected, leads will be assigned to you by default
            </p>
          </div>

          {/* CSV Preview */}
          {showPreview && csvData.length > 0 && (
            <div className="space-y-2">
              <Label>Preview (First 5 records)</Label>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Full Name</th>
                        <th className="px-3 py-2 text-left">Phone</th>
                        <th className="px-3 py-2 text-left">Company</th>
                        <th className="px-3 py-2 text-left">City</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{row.full_name}</td>
                          <td className="px-3 py-2">{row.phone_number}</td>
                          <td className="px-3 py-2">{row.company_name}</td>
                          <td className="px-3 py-2">{row.city}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvData.length > 5 && (
                  <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500">
                    ... and {csvData.length - 5} more records
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="space-y-2">
              <Label>Upload Results</Label>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700">
                    {uploadResult.results.successful} leads imported successfully
                  </span>
                </div>
                
                {uploadResult.results.failed > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-700">
                      {uploadResult.results.failed} leads failed to import
                    </span>
                  </div>
                )}

                {uploadResult.results.errors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-700">Errors:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {uploadResult.results.errors.map((error: string, index: number) => (
                        <p key={index} className="text-xs text-red-600">• {error}</p>
                      ))}
                    </div>
                  </div>
                )}

                {uploadResult.results.successful > 0 && (
                  <p className="text-sm text-green-600">
                    Redirecting to leads page in 3 seconds...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || csvData.length === 0 || isLoading}
            >
              {isLoading ? 'Uploading...' : `Import ${csvData.length} Leads`}
            </Button>
          </div>

          {/* Instructions */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-2">CSV Format Instructions:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Required columns: full_name</li>
              <li>• Optional columns: phone_number, company_name, city</li>
              <li>• First row should contain column headers</li>
              <li>• Duplicate leads (same phone or name+company) will be skipped</li>
              <li>• Email addresses will be auto-generated if not provided</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
