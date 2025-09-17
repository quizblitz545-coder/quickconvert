import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Upload, Download, FileText, Image, Music, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import './App.css'

const SUPPORTED_FORMATS = {
  document: {
    name: 'Documents',
    icon: FileText,
    formats: ['pdf', 'docx', 'txt', 'html', 'md'],
    color: 'text-blue-500'
  },
  image: {
    name: 'Images',
    icon: Image,
    formats: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'],
    color: 'text-green-500'
  },
  audio: {
    name: 'Audio',
    icon: Music,
    formats: ['mp3', 'wav', 'ogg', 'm4a'],
    color: 'text-purple-500'
  }
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [targetFormat, setTargetFormat] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)
  const [conversionStatus, setConversionStatus] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const getFileType = (filename) => {
    if (!filename) return null
    const ext = filename.split('.').pop().toLowerCase()
    for (const [type, config] of Object.entries(SUPPORTED_FORMATS)) {
      if (config.formats.includes(ext)) {
        return type
      }
    }
    return null
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setTargetFormat('')
      setError('')
      setDownloadUrl('')
      setConversionStatus('')
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setTargetFormat('')
      setError('')
      setDownloadUrl('')
      setConversionStatus('')
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const handleConvert = async () => {
    if (!selectedFile || !targetFormat) {
      setError('Please select a file and target format')
      return
    }

    setIsConverting(true)
    setConversionProgress(0)
    setError('')
    setDownloadUrl('')
    setConversionStatus('Preparing conversion...')

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('target_format', targetFormat)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setConversionProgress(prev => {
          if (prev < 90) return prev + 10
          return prev
        })
      }, 200)

      setConversionStatus('Converting file...')

      const response = await fetch('http://localhost:5000/api/convert', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setConversionProgress(100)

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
        setConversionStatus('Conversion completed successfully!')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Conversion failed')
        setConversionStatus('Conversion failed')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      setConversionStatus('Conversion failed')
    } finally {
      setIsConverting(false)
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${selectedFile.name.split('.')[0]}.${targetFormat}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setTargetFormat('')
    setIsConverting(false)
    setConversionProgress(0)
    setConversionStatus('')
    setDownloadUrl('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const fileType = selectedFile ? getFileType(selectedFile.name) : null
  const availableFormats = fileType ? SUPPORTED_FORMATS[fileType].formats : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            File Converter
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Convert any file format instantly - Fast, secure, and free
          </p>
        </div>

        {/* Main Conversion Interface */}
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload & Convert
              </CardTitle>
              <CardDescription>
                Select a file and choose your desired output format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.docx,.txt,.html,.md,.jpg,.jpeg,.png,.webp,.bmp,.tiff,.mp3,.wav,.ogg,.m4a"
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="text-lg font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports documents, images, and audio files
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Format Selection */}
              {selectedFile && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Convert to:
                    </label>
                    <Select value={targetFormat} onValueChange={setTargetFormat}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select output format" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFormats.map(format => (
                          <SelectItem key={format} value={format}>
                            {format.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Convert Button */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleConvert}
                      disabled={!targetFormat || isConverting}
                      className="flex-1"
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        'Convert File'
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Reset
                    </Button>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isConverting && (
                <div className="space-y-2">
                  <Progress value={conversionProgress} className="w-full" />
                  <p className="text-sm text-center text-gray-600">
                    {conversionStatus}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Download Section */}
              {downloadUrl && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 dark:text-green-300">
                        Conversion completed successfully!
                      </span>
                    </div>
                    <Button onClick={handleDownload} className="ml-4">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supported Formats */}
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(SUPPORTED_FORMATS).map(([type, config]) => {
              const IconComponent = config.icon
              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className={`w-5 h-5 ${config.color}`} />
                      {config.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {config.formats.map(format => (
                        <span
                          key={format}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm"
                        >
                          {format.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

